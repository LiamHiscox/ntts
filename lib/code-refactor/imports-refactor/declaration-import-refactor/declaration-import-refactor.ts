import { SourceFile, VariableDeclaration } from 'ts-morph';
import ImportValidator from '../helpers/import-validator';
import VariableNameGenerator from '../../helpers/variable-name-generator/variable-name-generator';
import ImportCreator from '../../helpers/import-creator/import-creator';

class DeclarationImportRefactor {
  static addVariableDeclarationImport = (
    declaration: VariableDeclaration,
    importId: string,
    usedNames: string[],
    sourceFile: SourceFile,
  ) => {
    const nameNode = ImportValidator.isValidImport(declaration);
    if (nameNode) {
      ImportCreator.addImport(nameNode, importId, sourceFile);
      declaration.remove();
    } else {
      const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
      const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, usedNames);
      const defaultImport = ImportCreator.addSimpleImport(variableName, importId, sourceFile);
      declaration.setInitializer(defaultImport);
    }
  };
}

export default DeclarationImportRefactor;
