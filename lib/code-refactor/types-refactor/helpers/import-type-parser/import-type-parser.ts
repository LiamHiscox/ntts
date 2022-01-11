import { Identifier, ImportTypeNode, Node, QualifiedName, SyntaxKind } from 'ts-morph';
import path, { relative } from 'path';
import PathParser from "../../../../helpers/path-parser/path-parser";

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

  static parseImportPath = (fullPath: string, filePath: string): string => {
    if (!path.isAbsolute(fullPath)) {
      return fullPath;
    }
    if (this.isNodeModulePackage(fullPath)) {
      return fullPath
        .replace(/^(.*?\/)?node_modules\/(@types\/)?/, '')
        .replace(/\/index((\.d)?\.ts)?$/, '');
    }
    const relativePath = PathParser.win32ToPosixPath(relative(filePath, fullPath));
    return this.toRelativeModuleSpecifier(relativePath);
  };

  static isNodeModulePackage = (fullPath: string): boolean => {
    return (/^(.*?\/)?node_modules\//).test(fullPath);
  };

  private static toRelativeModuleSpecifier = (moduleSpecifier: string): string => {
    if (moduleSpecifier.match(/^\.\.?\//)) {
      return moduleSpecifier;
    }
    return `./${moduleSpecifier}`;
  };
}

export default ImportTypeParser;
