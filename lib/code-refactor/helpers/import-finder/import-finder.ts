import { SourceFile } from 'ts-morph';

class ImportFinder {
  static getNonNamespaceImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile) => sourceFile
    .getImportDeclarations()
    .find((_import) => _import.getModuleSpecifierValue() === moduleSpecifier && !_import.getNamespaceImport());

  static getDefaultImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile) => sourceFile
    .getImportDeclarations()
    .find((_import) => _import.getModuleSpecifierValue() === moduleSpecifier && !!_import.getDefaultImport());

  static getNamespaceImportDeclaration = (moduleSpecifier: string, sourceFile: SourceFile) => sourceFile
    .getImportDeclarations()
    .find((_import) => _import.getModuleSpecifierValue() === moduleSpecifier && !!_import.getNamespaceImport());
}

export default ImportFinder;
