import {
  BindingElement,
  BindingName,
  Identifier,
  ImportDeclaration,
  ObjectBindingPattern,
  SourceFile,
  SyntaxKind
} from "ts-morph";
import {VariableNameGenerator} from "../variable-name-generator/variable-name-generator";
import {ImportFinder} from "../import-finder/import-finder";

export class ImportCreator {
  static addEmptyImport = (moduleSpecifier: string, sourceFile: SourceFile) => {
    const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier);
    if (!importDeclaration) {
      sourceFile.addImportDeclaration({moduleSpecifier});
    }
  }

  static addSimpleImport = (importName: string, moduleSpecifier: string, sourceFile: SourceFile): string => {
    const importDeclaration = ImportFinder.getNonNamespaceImportDeclaration(moduleSpecifier, sourceFile);
    const defaultImport = importDeclaration?.getDefaultImport()?.getText();
    if (importDeclaration && defaultImport) {
      return defaultImport;
    } else if (importDeclaration && !defaultImport) {
      importDeclaration.setDefaultImport(importName);
      return importName;
    } else {
      sourceFile.addImportDeclaration({
        defaultImport: importName,
        moduleSpecifier
      });
      return importName;
    }
  }

  static addNamedImport = (importName: string, moduleSpecifier: string, usedNames: string[], sourceFile: SourceFile): string => {
    const importDeclaration = ImportFinder.getNonNamespaceImportDeclaration(moduleSpecifier, sourceFile);
    const importSpecifier = importDeclaration?.getNamedImports().find(named => importName === named.getName());
    if (importDeclaration && importSpecifier) {
      return importSpecifier.getAliasNode()?.getText() || importSpecifier.getName();
    }
    const newImportName = VariableNameGenerator.getUsableVariableName(importName, usedNames);
    const namedImport = newImportName === importName ? importName : `${importName} as ${newImportName}`;
    if (importDeclaration) {
      importDeclaration.addNamedImport(namedImport);
      return newImportName;
    } else {
      sourceFile.addImportDeclaration({
        namedImports: [namedImport],
        moduleSpecifier
      });
      return newImportName;
    }
  }

  static addImport = (nameNode: BindingName, moduleSpecifier: string, sourceFile: SourceFile) => {
    const importDeclaration = ImportFinder.getNonNamespaceImportDeclaration(moduleSpecifier, sourceFile);
    switch (nameNode.getKind()) {
      case SyntaxKind.Identifier:
        this.addDefaultImportStatement(importDeclaration, nameNode as Identifier, moduleSpecifier, sourceFile);
        break;
      case SyntaxKind.ObjectBindingPattern:
        this.addNamedImportStatement(importDeclaration, nameNode as ObjectBindingPattern, moduleSpecifier, sourceFile);
        break;
    }
  }

  static addNamespaceImport = (importName: string, moduleSpecifier: string, sourceFile: SourceFile): string => {
    sourceFile.addImportDeclaration({
      namespaceImport: importName,
      moduleSpecifier
    });
    return importName;
  }

  private static getPropertyName = (element: BindingElement): string|undefined => {
    const nameNode = element.getPropertyNameNode();
    switch (nameNode?.getKind()) {
      case SyntaxKind.Identifier:
        return nameNode.asKindOrThrow(SyntaxKind.Identifier).getText();
      case SyntaxKind.StringLiteral:
        return nameNode.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
      case SyntaxKind.NoSubstitutionTemplateLiteral:
        return nameNode.asKindOrThrow(SyntaxKind.NoSubstitutionTemplateLiteral).getLiteralValue();
      case SyntaxKind.ComputedPropertyName:
        const computed = nameNode.asKindOrThrow(SyntaxKind.ComputedPropertyName);
        const literal = computed.getFirstChildByKind(SyntaxKind.StringLiteral) || computed.getFirstChildByKind(SyntaxKind.NoSubstitutionTemplateLiteral);
        return literal?.getLiteralValue();
      default:
        return;
    }
  }

  private static getNamedImports = (objectBinding: ObjectBindingPattern): string[] => {
    return objectBinding
      .getElements()
      .map(binding => {
        const propertyName = this.getPropertyName(binding);
        const bindingName = binding.getNameNode().getText();
        if (propertyName) {
          return `${propertyName} as ${bindingName}`;
        }
        return bindingName;
      });
  }

  private static addNamedImportStatement = (
    importDeclaration: ImportDeclaration | undefined,
    objectBinding: ObjectBindingPattern,
    moduleSpecifier: string,
    sourceFile: SourceFile
  ) => {
    const existingNamedImports = importDeclaration?.getNamedImports().map(named => named.getNameNode().getText());
    const namedImports = this.getNamedImports(objectBinding);
    if (namedImports.length <= 0) {
      return;
    } else if (importDeclaration && existingNamedImports) {
      const filteredImports = namedImports.filter(named => !existingNamedImports.includes(named));
      importDeclaration.addNamedImports(filteredImports);
    } else if (importDeclaration && !existingNamedImports) {
      importDeclaration.addNamedImports(namedImports);
    } else {
      sourceFile.addImportDeclaration({
        namedImports,
        moduleSpecifier: moduleSpecifier
      });
    }
  }

  private static addDefaultImportStatement = (
    importDeclaration: ImportDeclaration | undefined,
    identifier: Identifier,
    moduleSpecifier: string,
    sourceFile: SourceFile
  ) => {
    const defaultImport = importDeclaration?.getDefaultImport()?.getText();
    if (importDeclaration && defaultImport) {
      identifier.rename(defaultImport);
    } else if (importDeclaration && !defaultImport) {
      importDeclaration.setDefaultImport(identifier.getText());
    } else {
      sourceFile.addImportDeclaration({
        defaultImport: identifier.getText(),
        moduleSpecifier: moduleSpecifier
      });
    }
  }
}
