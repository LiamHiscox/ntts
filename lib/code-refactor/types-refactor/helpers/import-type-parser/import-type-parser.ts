import {
  Identifier, ImportTypeNode, Node, QualifiedName, SyntaxKind,
} from 'ts-morph';
import { existsSync } from 'fs';

class ImportTypeParser {
  static getFullModuleSpecifier = (importType: ImportTypeNode): string | undefined => importType
    .getArgument()
    .asKind(SyntaxKind.LiteralType)
    ?.getLiteral()
    .asKind(SyntaxKind.StringLiteral)
    ?.getLiteralValue();

  static getFirstIdentifier = (typeName: Identifier | QualifiedName): Identifier => {
    if (Node.isQualifiedName(typeName)) {
      return this.getFirstIdentifier(typeName.getLeft());
    }
    return typeName;
  };

  static parseImportPath = (relativePath: string, fullPath: string): string => {
    if (this.isNodeModulePackage(relativePath, fullPath)) {
      return relativePath
        .replace(/^(.*?\/)?node_modules\/(@types\/)?/, '')
        .replace(/\/index((\.d)?\.ts)?$/, '');
    }
    return this.toRelativeModuleSpecifier(relativePath);
  };

  static isNodeModulePackage = (moduleSpecifier: string, fullPath: string): boolean => {
    if (moduleSpecifier.includes('/node_modules/') || moduleSpecifier.startsWith('node_modules/')) {
      return true;
    }
    if (/.*(\.d)?\.ts$/.test(moduleSpecifier)) {
      return !existsSync(fullPath);
    }
    return !existsSync(`${fullPath}.ts`) && !existsSync(`${fullPath}.d.ts`);
  };

  private static toRelativeModuleSpecifier = (moduleSpecifier: string): string => {
    if (moduleSpecifier.match(/^..?\//)) {
      return moduleSpecifier;
    }
    return `./${moduleSpecifier}`;
  };
}

export default ImportTypeParser;
