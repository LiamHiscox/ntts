import {SourceFile, VariableDeclaration} from "ts-morph";
import {ImportValidator} from "../helpers/import-validator";
import {VariableNameGenerator} from "../helpers/variable-name-generator";

export class DeclarationImportRefactor {

  static addVariableDeclarationImport(
    declaration: VariableDeclaration,
    importId: string,
    sourceFile: SourceFile
  ) {
    const importName = declaration.getName();
    if (ImportValidator.isValidImport(declaration)) {
      sourceFile.addImportDeclaration({
        defaultImport: importName,
        moduleSpecifier: importId
      });
      declaration.remove();
    } else {
      const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
      const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, sourceFile);
      sourceFile.addImportDeclaration({
        defaultImport: variableName,
        moduleSpecifier: importId
      });
      declaration.setInitializer(variableName)
    }
  }
}
