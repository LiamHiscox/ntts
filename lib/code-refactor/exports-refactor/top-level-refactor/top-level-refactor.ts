import {
  BinaryExpression,
  ClassExpression,
  ExpressionStatement,
  Identifier,
  Node,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import ExportedVariableModel from '../../../models/exported-variable.model';
import VariableNameGenerator from '../../helpers/variable-name-generator/variable-name-generator';
import VariableCreator from '../helpers/variable-creator';
import ExportParser from '../helpers/export-parser';
import WriteAccessChecker from '../../helpers/write-access-checker/write-access-checker';
import {AccessExpressionKind} from '../../helpers/combined-types/combined-types';
import {isWriteAccess} from "../../helpers/expression-handler/expression-handler";

class TopLevelRefactor {
  static refactorTopLevelExport = (
    exportName: string,
    binary: BinaryExpression,
    expression: ExpressionStatement,
    accessExpression: AccessExpressionKind,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    defaultExport: boolean,
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    const exported = ExportParser.exportVariableExists(exportName, exportedVariables, defaultExport);
    const exportedNames = exportedVariables.map((e) => e.name);
    if (exported && exported.directExport) {
      return this.refactorExistingDirectExport(exported, usedNames.concat(exportedNames), binary, accessExpression, exportedVariables, sourceFile);
    }
    if (exported) {
      this.refactorExistingExport(exported, accessExpression, sourceFile);
      return exportedVariables;
    }
    if (Node.isIdentifier(binary.getRight())) {
      const newExport = this.refactorIdentifierAssignment(exportName, binary, expression, usedNames.concat(exportedNames), defaultExport, sourceFile);
      return exportedVariables.concat(newExport);
    }
    if (Node.isClassExpression(binary.getRight())) {
      const newExport = this.refactorClassAssignment(exportName, binary, expression, usedNames.concat(exportedNames), defaultExport, sourceFile);
      return exportedVariables.concat(newExport);
    }
    const newExport = this.refactorNewExport(exportName, binary, expression, usedNames.concat(exportedNames), defaultExport, sourceFile);
    return exportedVariables.concat(newExport);
  };

  private static refactorExistingDirectExport = (
    exported: ExportedVariableModel,
    usedNames: string[],
    binary: BinaryExpression,
    accessExpression: AccessExpressionKind,
    exportedVariables: ExportedVariableModel[],
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    const usableName = VariableNameGenerator.getUsableVariableName(exported.name, usedNames);
    const index = ExportParser.getSourceFileIndex(binary);
    VariableCreator.createVariable(usableName, index, exported.name, VariableDeclarationKind.Let, sourceFile);
    accessExpression.replaceWithText(usableName);
    return exportedVariables.map((variable) => {
      if (variable.name === exported.name && variable.alias === exported.alias) {
        return { name: usableName, alias: exported.alias || exported.name, defaultExport: exported.defaultExport };
      }
      return variable;
    });
  };

  private static refactorExistingExport = (
    exported: ExportedVariableModel,
    accessExpression: AccessExpressionKind,
    sourceFile: SourceFile,
  ) => {
    const statement = sourceFile.getVariableStatementOrThrow(exported.name);
    if (statement.getDeclarationKind() === VariableDeclarationKind.Const && isWriteAccess(accessExpression)) {
      statement.setDeclarationKind(VariableDeclarationKind.Let);
    }
    accessExpression.replaceWithText(exported.name);
  };

  private static refactorClassAssignment = (
    exportName: string,
    binary: BinaryExpression,
    expression: ExpressionStatement,
    usedNames: string[],
    defaultExport: boolean,
    sourceFile: SourceFile,
  ): ExportedVariableModel => {
    const assignedClass = binary.getRight().asKindOrThrow(SyntaxKind.ClassExpression);
    const className = this.refactorClassExpressionExport(assignedClass, exportName, usedNames);
    sourceFile.insertStatements(ExportParser.getSourceFileIndex(binary), assignedClass.getText());
    expression.remove();
    const exportModel: ExportedVariableModel = {
      name: className,
      directExport: true,
      defaultExport,
    };
    return exportName === className ? exportModel : { ...exportModel, alias: exportName };
  };

  private static refactorIdentifierAssignment = (
    exportName: string,
    binary: BinaryExpression,
    expression: ExpressionStatement,
    usedNames: string[],
    defaultExport: boolean,
    sourceFile: SourceFile,
  ): ExportedVariableModel => {
    const assignedIdentifier = binary.getRight().asKindOrThrow(SyntaxKind.Identifier);
    if (this.canExportDirectly(assignedIdentifier, sourceFile)) {
      const assignedName = assignedIdentifier.getText();
      expression.remove();
      const exportModel: ExportedVariableModel = {
        name: assignedName,
        directExport: true,
        defaultExport,
      };
      return exportName === assignedName ? exportModel : { ...exportModel, alias: exportName };
    }
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames);
    VariableCreator.createVariable(
      usableName,
      ExportParser.getSourceFileIndex(binary),
      binary.getRight().getText(),
      VariableDeclarationKind.Const,
      sourceFile,
    );
    expression.remove();
    return { name: usableName, alias: exportName };
  };

  private static refactorNewExport = (
    exportName: string,
    binary: BinaryExpression,
    expression: ExpressionStatement,
    usedNames: string[],
    defaultExport: boolean,
    sourceFile: SourceFile,
  ): ExportedVariableModel => {
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames);
    VariableCreator.createVariable(
      usableName,
      ExportParser.getSourceFileIndex(binary),
      binary.getRight().getText(),
      VariableDeclarationKind.Const,
      sourceFile,
    );
    expression.remove();
    return {
      name: usableName,
      alias: exportName !== usableName ? exportName : undefined,
      defaultExport,
    };
  };

  private static refactorClassExpressionExport = (classExpression: ClassExpression, exportName: string, usedNames: string[]): string => {
    const className = classExpression.getName();
    if (className && !usedNames.includes(className)) {
      return className;
    }
    if (!usedNames.includes(exportName)) {
      classExpression.rename(exportName);
      return exportName;
    }
    const usableClassName = VariableNameGenerator.getUsableVariableName(`${exportName}Type`, usedNames);
    classExpression.rename(usableClassName);
    return usableClassName;
  };

  private static canExportDirectly = (identifier: Identifier, sourceFile: SourceFile): boolean => {
    const nodeName = identifier.getText();
    const implementation = sourceFile.getVariableDeclaration(nodeName) || sourceFile.getFunction(nodeName) || sourceFile.getClass(nodeName);
    if (Node.isFunctionDeclaration(implementation) || Node.isClassDeclaration(implementation)) {
      return true;
    }
    if (Node.isVariableDeclaration(implementation)) {
      return !WriteAccessChecker.hasValueChanged(implementation);
    }
    return false;
  };
}

export default TopLevelRefactor;
