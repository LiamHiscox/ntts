import {Identifier, ImportTypeNode, SourceFile, TypeReferenceNode} from "ts-morph";
import {relative} from "path";
import {PathParser} from "../../../helpers/path-parser/path-parser";
import {UsedNames} from "../../helpers/used-names/used-names";
import {ImportCreator} from "../../helpers/import-creator/import-creator";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {ImportFinder} from "../../helpers/import-finder/import-finder";
import {ImportTypeParser} from "../helpers/import-type-parser/import-type-parser";

export class TypeNodeRefactor {
  static importGlobalTypes = (typeReference: TypeReferenceNode, sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    const identifier = ImportTypeParser.getFirstIdentifier(typeReference.getTypeName());
    const declaration = identifier.getSymbol()?.getDeclarations()[0];
    const declarationPath = declaration?.getSourceFile().getFilePath();

    if (declarationPath && !this.isTypescriptOrNodeVariable(declarationPath) && declarationPath !== sourceFile.getFilePath()) {
      const relativePath = PathParser.win32ToPosixPath(relative(sourceFile.getDirectoryPath(), declarationPath));
      const moduleSpecifier = ImportTypeParser.parseImportPath(relativePath, declarationPath);
      const newImportName = this.addGlobalImport(identifier, moduleSpecifier, usedNames, sourceFile);
      identifier.replaceWithText(newImportName);
    }
  }

  private static isTypescriptOrNodeVariable = (importPath: string): boolean => {
    return importPath.includes('/node_modules/typescript/') || importPath.includes('/node_modules/@types/node/');
  }

  static refactor = (importType: ImportTypeNode, sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    const fullModuleSpecifier = ImportTypeParser.getFullModuleSpecifier(importType);
    if (!fullModuleSpecifier)
      return;
    const relativePath = PathParser.win32ToPosixPath(relative(sourceFile.getDirectoryPath(), fullModuleSpecifier));
    const moduleSpecifier = ImportTypeParser.parseImportPath(relativePath, fullModuleSpecifier);
    const qualifier = importType.getQualifier();

    if (!qualifier) {
      const newImportName = this.addImport(qualifier, moduleSpecifier, usedNames, sourceFile);
      importType.replaceWithText(newImportName);
    } else {
      const identifier = ImportTypeParser.getFirstIdentifier(qualifier);
      const newImportName = this.addImport(identifier, moduleSpecifier, usedNames, sourceFile);
      identifier.replaceWithText(newImportName);
      importType.replaceWithText(importType.getText().replace(/^import\(.*?\)\./, ''));
    }
  }

  private static addGlobalImport = (identifier: Identifier, moduleSpecifier: string, usedNames: string[], sourceFile: SourceFile): string => {
    const defaultImport = ImportFinder.getDefaultImportDeclaration(moduleSpecifier, sourceFile);
    if (!defaultImport) {
      const usableName = VariableNameGenerator.getUsableVariableName(identifier.getText(), usedNames);
      return ImportCreator.addSimpleImport(usableName, moduleSpecifier, sourceFile);
    } else {
      return defaultImport.getDefaultImportOrThrow().getText();
    }
  }

  private static addImport = (identifier: Identifier | undefined, moduleSpecifier: string, usedNames: string[], sourceFile: SourceFile): string => {
    const namespaceImport = !identifier && ImportFinder.getNamespaceImportDeclaration(moduleSpecifier, sourceFile);
    if (!identifier && !namespaceImport) {
      const defaultImport = VariableNameGenerator.variableNameFromImportId(moduleSpecifier);
      const usableName = VariableNameGenerator.getUsableVariableName(defaultImport, usedNames);
      return ImportCreator.addNamespaceImport(usableName, moduleSpecifier, sourceFile);
    }
    if (!identifier && namespaceImport) {
      return namespaceImport.getNamespaceImportOrThrow().getText();
    }
    if (identifier!.getText() === "default") {
      const defaultImport = VariableNameGenerator.variableNameFromImportId(moduleSpecifier);
      const usableName = VariableNameGenerator.getUsableVariableName(defaultImport, usedNames);
      return ImportCreator.addSimpleImport(usableName, moduleSpecifier, sourceFile);
    }
    return ImportCreator.addNamedImport(identifier!.getText(), moduleSpecifier, usedNames, sourceFile);
  }
}