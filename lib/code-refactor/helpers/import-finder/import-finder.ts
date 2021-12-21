import {ImportDeclaration, SourceFile} from "ts-morph";

export class ImportFinder {
  static getNonNamespaceImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile): ImportDeclaration | undefined => {
    return sourceFile
      .getImportDeclarations()
      .find(_import => _import.getModuleSpecifierValue() === moduleSpecifier && !_import.getNamespaceImport());
  }

  static getDefaultImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile): ImportDeclaration | undefined => {
    return sourceFile
      .getImportDeclarations()
      .find(_import => _import.getModuleSpecifierValue() === moduleSpecifier && !!_import.getDefaultImport());
  }

  static getNamespaceImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile): ImportDeclaration | undefined => {
    return sourceFile
      .getImportDeclarations()
      .find(_import => _import.getModuleSpecifierValue() === moduleSpecifier && !!_import.getNamespaceImport());
  }
}
