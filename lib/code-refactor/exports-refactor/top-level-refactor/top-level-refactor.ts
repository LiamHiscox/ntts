import {
  BinaryExpression,
  ClassExpression,
  ElementAccessExpression,
  ExpressionStatement,
  Identifier,
  PropertyAccessExpression,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind
} from "ts-morph";
import {ExportedVariableModel} from "../../../models/exported-variable.model";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {VariableCreator} from "../helpers/variable-creator";
import {ExportParser} from "../helpers/export-parser";
import {WriteAccessChecker} from "../../helpers/write-access-checker/write-access-checker";

export class TopLevelRefactor {
  static refactorTopLevelExport = (exportName: string,
                                   binary: BinaryExpression,
                                   expression: ExpressionStatement,
                                   accessExpression: Identifier | PropertyAccessExpression | ElementAccessExpression,
                                   exportedVariables: ExportedVariableModel[],
                                   usedNames: string[],
                                   defaultExport: boolean,
                                   sourceFile: SourceFile
  ): ExportedVariableModel[] => {
    const exported = ExportParser.exportVariableExists(exportName, exportedVariables, defaultExport);
    const exportedNames = exportedVariables.map(e => e.name);
    if (exported && exported.directExport) {
      return this.refactorExistingDirectExport(exported, usedNames.concat(exportedNames), binary, accessExpression, exportedVariables, sourceFile);
    } else if (exported) {
      this.refactorExistingExport(exported, accessExpression, sourceFile);
      return exportedVariables;
    } else if (binary.getRight().asKind(SyntaxKind.Identifier)) {
      const newExport = this.refactorIdentifierAssignment(exportName, binary, expression, usedNames.concat(exportedNames), defaultExport, sourceFile);
      return exportedVariables.concat(newExport);
    } else if (binary.getRight().asKind(SyntaxKind.ClassExpression)) {
      const newExport = this.refactorClassAssignment(exportName, binary, expression, usedNames.concat(exportedNames), defaultExport, sourceFile);
      return exportedVariables.concat(newExport);
    } else {
      const newExport = this.refactorNewExport(exportName, binary, expression, usedNames.concat(exportedNames), defaultExport, sourceFile);
      return exportedVariables.concat(newExport);
    }
  }

  private static refactorExistingDirectExport = (exported: ExportedVariableModel,
                                                 usedNames: string[],
                                                 binary: BinaryExpression,
                                                 accessExpression: Identifier | PropertyAccessExpression | ElementAccessExpression,
                                                 exportedVariables: ExportedVariableModel[],
                                                 sourceFile: SourceFile
  ): ExportedVariableModel[] => {
    const usableName = VariableNameGenerator.getUsableVariableName(exported.name, usedNames);
    const index = ExportParser.getSourceFileIndex(binary);
    VariableCreator.createVariable(usableName, index, exported.name, VariableDeclarationKind.Let, sourceFile);
    accessExpression.replaceWithText(usableName);
    return exportedVariables.map(variable => {
      if (variable.name === exported.name && variable.alias === exported.alias) {
        return {name: usableName, alias: exported.alias || exported.name, defaultExport: exported.defaultExport};
      }
      return variable;
    });
  }

  private static refactorExistingExport = (exported: ExportedVariableModel,
                                           accessExpression: Identifier | PropertyAccessExpression | ElementAccessExpression,
                                           sourceFile: SourceFile
  ) => {
    sourceFile.getVariableStatementOrThrow(exported.name).setDeclarationKind(VariableDeclarationKind.Let);
    accessExpression.replaceWithText(exported.name);
  }

  private static refactorClassAssignment = (exportName: string,
                                            binary: BinaryExpression,
                                            expression: ExpressionStatement,
                                            usedNames: string[],
                                            defaultExport: boolean,
                                            sourceFile: SourceFile
  ): ExportedVariableModel => {
    const assignedClass = binary.getRight().asKindOrThrow(SyntaxKind.ClassExpression);
    const className = this.refactorClassExpressionExport(assignedClass, exportName, usedNames);
    sourceFile.insertStatements(ExportParser.getSourceFileIndex(binary), assignedClass.getText());
    expression.remove();
    const exportModel: ExportedVariableModel = {
      name: className,
      directExport: true,
      defaultExport
    }
    return exportName === className ? exportModel : {...exportModel, alias: exportName};
  }

  private static refactorIdentifierAssignment = (exportName: string,
                                                 binary: BinaryExpression,
                                                 expression: ExpressionStatement,
                                                 usedNames: string[],
                                                 defaultExport: boolean,
                                                 sourceFile: SourceFile
  ): ExportedVariableModel => {
    const assignedIdentifier = binary.getRight().asKindOrThrow(SyntaxKind.Identifier);
    if (this.canExportDirectly(assignedIdentifier, sourceFile)) {
      const assignedName = assignedIdentifier.getText();
      expression.remove();
      const exportModel: ExportedVariableModel = {
        name: assignedName,
        directExport: true,
        defaultExport
      }
      return exportName === assignedName ? exportModel : {...exportModel, alias: exportName};
    }
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames);
    VariableCreator.createVariable(usableName, ExportParser.getSourceFileIndex(binary), binary.getRight().getText(), VariableDeclarationKind.Const, sourceFile);
    expression.remove();
    return {name: usableName, alias: exportName};
  }

  private static refactorNewExport = (exportName: string,
                                      binary: BinaryExpression,
                                      expression: ExpressionStatement,
                                      usedNames: string[],
                                      defaultExport: boolean,
                                      sourceFile: SourceFile
  ): ExportedVariableModel => {
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames);
    VariableCreator.createVariable(usableName, ExportParser.getSourceFileIndex(binary), binary.getRight().getText(), VariableDeclarationKind.Const, sourceFile);
    expression.remove();
    return {
      name: usableName,
      alias: exportName !== usableName ? exportName : undefined,
      defaultExport
    };
  }

  private static refactorClassExpressionExport = (classExpression: ClassExpression, exportName: string, usedNames: string[]): string => {
    const className = classExpression.getName();
    if (exportName === "_default" && className && !usedNames.includes(className)) {
      return className;
    }
    if (!usedNames.includes(exportName)) {
      classExpression.rename(exportName);
      return exportName;
    }
    const usableClassName = VariableNameGenerator.getUsableVariableName(exportName + 'Type', usedNames);
    classExpression.rename(usableClassName);
    return usableClassName;
  }

  private static canExportDirectly = (identifier: Identifier, sourceFile: SourceFile): boolean => {
    const nodeName = identifier.getText();
    const implementation = sourceFile.getVariableDeclaration(nodeName) || sourceFile.getFunction(nodeName) || sourceFile.getClass(nodeName);
    switch (implementation?.getKind()) {
      case SyntaxKind.FunctionDeclaration:
      case SyntaxKind.ClassDeclaration:
        return true;
      case SyntaxKind.VariableDeclaration:
        return !WriteAccessChecker.hasValueChanged(implementation!.asKindOrThrow(SyntaxKind.VariableDeclaration));
      default:
        return false;
    }
  }
}
