import {
  BinaryExpression, ElementAccessExpression,
  ExpressionStatement,
  PropertyAccessExpression,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind
} from "ts-morph";
import {ExportedVariableModel} from "../../../models/exported-variable.model";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {VariableCreator} from "../helpers/variable-creator";
import {ExportParser} from "../helpers/export-parser";

export class TopLevelRefactor {
  static refactorTopLevelExport(
    exportName: string,
    binary: BinaryExpression,
    expression: ExpressionStatement,
    accessExpression: PropertyAccessExpression | ElementAccessExpression,
    exportedVariables: ExportedVariableModel[],
    usedVariables: string[],
    sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const exported = ExportParser.exportVariableExists(exportName, exportedVariables);
    if (exported) {
      this.refactorExistingExport(exported, accessExpression);
      return exportedVariables;
    } else if (binary.getRight().asKind(SyntaxKind.Identifier)) {
      const newExport = this.refactorIdentifierAssignment(exportName, binary, expression, usedVariables, sourceFile);
      return exportedVariables.concat(newExport);
    } else {
      const newExport = this.refactorNewExport(exportName, binary, expression, usedVariables, sourceFile);
      return exportedVariables.concat(newExport);
    }
  }

  private static refactorExistingExport(exported: ExportedVariableModel, accessExpression: PropertyAccessExpression | ElementAccessExpression) {
    accessExpression.replaceWithText(exported.name);
  }

  private static refactorIdentifierAssignment(exportName: string, binary: BinaryExpression, expression: ExpressionStatement, usedVariables: string[], sourceFile: SourceFile) {
    const alias = binary.getRight().asKindOrThrow(SyntaxKind.Identifier).getText();
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedVariables, sourceFile);
    VariableCreator.createVariable(usableName, ExportParser.getSourceFileIndex(binary), binary.getRight().getText(), VariableDeclarationKind.Const, sourceFile);
    expression.remove();
    return {name: usableName, alias};
  }

  private static refactorNewExport(exportName: string, binary: BinaryExpression, expression: ExpressionStatement, usedVariables: string[], sourceFile: SourceFile) {
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedVariables, sourceFile);
    VariableCreator.createVariable(usableName, ExportParser.getSourceFileIndex(binary), binary.getRight().getText(), VariableDeclarationKind.Const, sourceFile);
    expression.remove();
    return {
      name: usableName,
      alias: exportName !== usableName ? exportName : undefined
    };
  }
}
