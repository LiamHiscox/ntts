import {Identifier, ImportTypeNode, SourceFile, SyntaxKind, TypeReferenceNode} from "ts-morph";
import {relative} from "path";
import {PathParser} from "../../../helpers/path-parser/path-parser";
import {UsedNames} from "../../helpers/used-names/used-names";
import {ImportCreator} from "../../helpers/import-creator/import-creator";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {ImportFinder} from "../../helpers/import-finder/import-finder";
import {existsSync} from "fs";
import {ImportTypeParser} from "../helpers/import-type-parser/import-type-parser";

export class TypeNodeRefactor {
  static importGlobalTypes = (typeReference: TypeReferenceNode, sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    const identifier = ImportTypeParser.getFirstIdentifier(typeReference.getTypeName());
    const declaration = identifier.getSymbol()?.getDeclarations()[0];
    const declarationPath = declaration?.getSourceFile().getFilePath();
    if (declarationPath && declarationPath !== sourceFile.getFilePath()) {
      const relativePath = PathParser.win32ToPosixPath(relative(sourceFile.getDirectoryPath(), declarationPath));
      const moduleSpecifier = this.parseImportPath(relativePath);
      const newImportName = this.addImport(identifier, moduleSpecifier, usedNames, sourceFile);
      identifier.replaceWithText(newImportName);
    }
  }

  static refactor = (importType: ImportTypeNode, sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    const fullModuleSpecifier = importType
      .getArgument()
      .asKind(SyntaxKind.LiteralType)
      ?.getLiteral()
      .asKind(SyntaxKind.StringLiteral)
      ?.getLiteralValue();

    if (!fullModuleSpecifier)
      return;
    const relativePath = PathParser.win32ToPosixPath(relative(sourceFile.getDirectoryPath(), fullModuleSpecifier));
    const moduleSpecifier = this.parseImportPath(relativePath);
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

  private static parseImportPath = (relativePath: string) => {
    if (this.isNodeModulePackage(relativePath)) {
      return relativePath
        .replace(/^(.*?\/)?node_modules\/(@types\/)?/, '')
        .replace(/\/index((\.d)?\.ts)?$/, '');
    }
    return this.toRelativeModuleSpecifier(relativePath);
  }

  private static isNodeModulePackage = (moduleSpecifier: string): boolean => {
    return moduleSpecifier.includes('/node_modules/')
      || (!existsSync(moduleSpecifier + '.ts') && !existsSync(moduleSpecifier + '.d.ts'));
  }

  private static toRelativeModuleSpecifier = (moduleSpecifier: string): string => {
    if (moduleSpecifier.match(/^..?\//))
      return moduleSpecifier;
    return `./${moduleSpecifier}`;
  }
}
