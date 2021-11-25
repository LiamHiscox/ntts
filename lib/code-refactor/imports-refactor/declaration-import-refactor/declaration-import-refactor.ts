import {SourceFile, VariableDeclaration} from "ts-morph";
import {ImportValidator} from "../helpers/import-validator";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {ImportCreator} from "../../helpers/import-creator/import-creator";

export class DeclarationImportRefactor {

  static addVariableDeclarationImport = (
    declaration: VariableDeclaration,
    importId: string,
    usedNames: string[],
    sourceFile: SourceFile
  ) => {
    if (ImportValidator.isValidImport(declaration)) {
      ImportCreator.addImport(declaration.getNameNode(), importId, sourceFile);
      declaration.remove();
    } else {
      const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
      const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, usedNames);
      const defaultImport = ImportCreator.addSimpleImport(variableName, importId, sourceFile);
      declaration.setInitializer(defaultImport)
    }
  }
}
