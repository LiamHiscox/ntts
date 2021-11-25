import {ImportDeclaration, SourceFile} from "ts-morph";

export class ImportFinder {
  static getNonNamespaceImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile): ImportDeclaration | undefined => {
    return sourceFile
      .getImportDeclarations()
      .find(_import => _import.getModuleSpecifierValue() === moduleSpecifier && !_import.getNamespaceImport());
  }
/*
  static findNamedImport = (moduleSpecifier: string, importName: string, sourceFile: SourceFile): ImportSpecifier | undefined => {
    return sourceFile.getImportDeclarations().reduce((acc: undefined | ImportSpecifier, _import) => {
      if (_import.getModuleSpecifierValue() === moduleSpecifier) {
        const named = _import.getNamedImports().find(namedImport => namedImport.getName() === importName);
        return named ? named : acc;
      }
      return acc;
    }, undefined);
  }

  static getDefaultImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile): ImportDeclaration | undefined => {
    return sourceFile
      .getImportDeclarations()
      .find(_import => _import.getModuleSpecifierValue() === moduleSpecifier && !!_import.getDefaultImport());
  }
*/
  static getNamespaceImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile): ImportDeclaration | undefined => {
    return sourceFile
      .getImportDeclarations()
      .find(_import => _import.getModuleSpecifierValue() === moduleSpecifier && !!_import.getNamespaceImport());
  }
}
