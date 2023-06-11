import { CallExpression, SourceFile } from 'ts-morph';
import VariableNameGenerator from '../../helpers/variable-name-generator/variable-name-generator.js';
import ImportCreator from '../../helpers/import-creator/import-creator.js';

class CallImportsRefactor {
  static addCallExpressionImport = (
    callExpression: CallExpression,
    importId: string,
    usedNames: string[],
    sourceFile: SourceFile,
  ) => {
    const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
    const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, usedNames);
    const defaultImport = ImportCreator.addSimpleImport(variableName, importId, sourceFile);
    callExpression.replaceWithText(defaultImport);
  };
}

export default CallImportsRefactor;
