import {ImportDeclaration, ImportSpecifier, SourceFile, VariableDeclarationKind} from "ts-morph";
import {ImportCreator} from "../helpers/import-creator";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";

export class ImportClauseRefactor {
  static refactorImportClause = (importStatement: ImportDeclaration, usedImportNames: string[], sourceFile: SourceFile): string[] => {
    const moduleSpecifier = importStatement.getModuleSpecifierValue();
    const importedSourceFile = importStatement.isModuleSpecifierRelative() && importStatement.getModuleSpecifierSourceFile();
    if (importedSourceFile) {
      this.refactorDefaultImport(importStatement, moduleSpecifier, importedSourceFile, sourceFile);
      return this.refactorNamedImports(importStatement, usedImportNames, importedSourceFile, sourceFile);
    }
    return usedImportNames;
  }

  private static refactorDefaultImport = (importStatement: ImportDeclaration, moduleSpecifier: string, importedSourceFile: SourceFile, sourceFile: SourceFile) => {
    const defaultImport = importStatement.getDefaultImport()?.getText();
    if (defaultImport && !this.hasDefaultExport(importedSourceFile)) {
      if (importStatement.getNamedImports().length > 0) {
        ImportCreator.addNamespaceImport(defaultImport, moduleSpecifier, sourceFile);
        importStatement.removeDefaultImport();
      } else {
        importStatement.removeDefaultImport().setNamespaceImport(defaultImport);
      }
    }
  }

  private static refactorNamedImports = (importStatement: ImportDeclaration, usedImportNames: string[], importedSourceFile: SourceFile, sourceFile: SourceFile): string[] => {
    const namedImports = importStatement.getNamedImports();
    if (namedImports.length > 0) {
      const exportedList = this.getExportedList(importedSourceFile);
      const defaultImports = namedImports.filter(namedImport => !exportedList.includes(namedImport.getName()));
      const defaultImportName = importStatement.getDefaultImport()?.getText();

      if (defaultImportName && defaultImports.length > 0) {
        this.createObjectDestructuring(importStatement, defaultImports, defaultImportName, sourceFile);
        defaultImports.forEach(d => d.remove());
      }
      if (!defaultImportName && defaultImports.length > 0) {
        const importName = VariableNameGenerator.variableNameFromImportId(importStatement.getModuleSpecifierValue());
        const initializer = VariableNameGenerator.getUsableVariableName(importName, usedImportNames);
        importStatement.setDefaultImport(initializer);
        this.createObjectDestructuring(importStatement, defaultImports, initializer, sourceFile);
        defaultImports.forEach(d => d.remove());
        return usedImportNames.concat(importName);
      }
    }
    return usedImportNames;
  }

  private static getExportedList = (importedSourceFile: SourceFile): string[] => {
    return importedSourceFile.getExportDeclarations().reduce((exportedNames, exportDeclaration) => {
      const names = exportDeclaration.getNamedExports().map(named => named.getAliasNode()?.getText() || named.getName());
      return exportedNames.concat(...names);
    }, new Array<string>());
  }

  private static createObjectDestructuring = (importStatement: ImportDeclaration, defaultImports: ImportSpecifier[], initializer: string, sourceFile: SourceFile) => {
    const index = importStatement.getChildIndex();
    const objectDestructuring = defaultImports.map(_import => _import.getAliasNode() ? `${_import.getName()}: ${_import.getAliasNode()}` : _import.getName()).join(', ');
    sourceFile.insertVariableStatement(index + 1, {
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{name: `{ ${objectDestructuring} }`, initializer}]
    })
  }

  private static hasDefaultExport = (sourceFile: SourceFile): boolean => {
    return !!sourceFile.getDefaultExportSymbol();
  }
}
