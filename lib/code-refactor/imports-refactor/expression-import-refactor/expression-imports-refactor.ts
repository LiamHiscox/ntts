import {ExpressionStatement, SourceFile} from "ts-morph";
import {VariableNameGenerator} from "../helpers/variable-name-generator";

export class ExpressionImportsRefactor {
  static addExpressionStatementImport(
    expression: ExpressionStatement,
    importId: string,
    sourceFile: SourceFile,
  ) {
    const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
    const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, sourceFile);
    sourceFile.addImportDeclaration({
      defaultImport: variableName,
      moduleSpecifier: importId
    });
    expression.remove();
  }
}
