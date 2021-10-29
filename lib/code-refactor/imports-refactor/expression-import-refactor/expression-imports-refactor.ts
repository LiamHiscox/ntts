import {ExpressionStatement, SourceFile} from "ts-morph";
import {VariableNameGenerator} from "../helpers/variable-name-generator";
import {ImportCreator} from "../helpers/import-creator";

export class ExpressionImportsRefactor {
  static addExpressionStatementImport(
    expression: ExpressionStatement,
    importId: string,
    sourceFile: SourceFile,
  ) {
    const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
    const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, sourceFile);
    ImportCreator.addSimpleImport(variableName, importId, sourceFile);
    expression.remove();
  }
}
