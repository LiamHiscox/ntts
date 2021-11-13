import {
  BindingElement,
  BindingName,
  Identifier,
  ImportDeclaration,
  ObjectBindingPattern,
  SourceFile,
  SyntaxKind
} from "ts-morph";

export class ImportCreator {
  static addEmptyImport = (moduleSpecifier: string, sourceFile: SourceFile) => {
    const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier);
    if (!importDeclaration) {
      sourceFile.addImportDeclaration({moduleSpecifier});
    }
  }

  static addSimpleImport = (importName: string, moduleSpecifier: string, sourceFile: SourceFile): string => {
    const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier);
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

  static addImport = (nameNode: BindingName, moduleSpecifier: string, sourceFile: SourceFile) => {
    const importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier);
    switch (nameNode.getKind()) {
      case SyntaxKind.Identifier:
        this.addDefaultImportStatement(importDeclaration, nameNode as Identifier, moduleSpecifier, sourceFile);
        break;
      case SyntaxKind.ObjectBindingPattern:
        this.addNamedImportStatement(importDeclaration, nameNode as ObjectBindingPattern, moduleSpecifier, sourceFile);
        break;
    }
  }

  static addNamespaceImport = (importName: string, moduleSpecifier: string, sourceFile: SourceFile) => {
    sourceFile.addImportDeclaration({
      namespaceImport: importName,
      moduleSpecifier
    });
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
        const bindingName = (binding.getNameNode() as Identifier).getText();
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
