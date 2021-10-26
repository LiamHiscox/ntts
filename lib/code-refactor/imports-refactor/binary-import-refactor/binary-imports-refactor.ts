import {CallExpression, SourceFile} from "ts-morph";
import {VariableNameGenerator} from "../helpers/variable-name-generator";

export class BinaryImportsRefactor {
  static addBinaryExpressionImport(
    callExpression: CallExpression,
    importId: string,
    sourceFile: SourceFile,
  ) {
    const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
    const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, sourceFile);
    sourceFile.addImportDeclaration({
      defaultImport: variableName,
      moduleSpecifier: importId
    });
    callExpression.replaceWithText(variableName);
  }
}
