import {Identifier, ImportTypeNode, Node, QualifiedName, SourceFile, SyntaxKind} from "ts-morph";
import {relative} from "path";
import {PathParser} from "../../../helpers/path-parser/path-parser";
import {UsedNames} from "../../helpers/used-names/used-names";
import {ImportCreator} from "../../helpers/import-creator/import-creator";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {ImportFinder} from "../../helpers/import-finder/import-finder";
import {existsSync} from "fs";

export class ImportTypeRefactor {
  static refactor = (importType: ImportTypeNode, sourceFile: SourceFile) => {
    const usedNames = UsedNames.getDeclaredNames(sourceFile);
    const fullModuleSpecifier = importType
      .getArgument()
      .asKind(SyntaxKind.LiteralType)
      ?.getLiteral()
      .asKind(SyntaxKind.StringLiteral)
      ?.getLiteralValue();

    if (!fullModuleSpecifier) {
      return;
    }
    const cwd = process.cwd();
    const relativePath = PathParser.win32ToPosixPath(relative(cwd, fullModuleSpecifier));
    const moduleSpecifier = this.parseImportPath(relativePath);
    const qualifier = importType.getQualifier();

    if (qualifier && Node.isIdentifier(qualifier)){
      const newImportName = this.addImport(qualifier, moduleSpecifier, usedNames, sourceFile);
      qualifier.replaceWithText(newImportName);
      importType.replaceWithText(importType.getText().replace(/^import\(.*?\)\./, ''));
    } else if (qualifier && Node.isQualifiedName(qualifier)) {
      const identifier = this.getFirstIdentifier(qualifier);
      const newImportName = this.addImport(identifier, moduleSpecifier, usedNames, sourceFile);
      identifier.replaceWithText(newImportName);
      importType.replaceWithText(importType.getText().replace(/^import\(.*?\)\./, ''));
    } else {
      const newImportName = this.addImport(qualifier, moduleSpecifier, usedNames, sourceFile);
      importType.replaceWithText(newImportName);
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

  private static getFirstIdentifier = (qualifer: QualifiedName): Identifier => {
    const left = qualifer.getLeft();
    if (Node.isQualifiedName(left)) {
      return this.getFirstIdentifier(left);
    }
    return left;
  }

  private static parseImportPath = (relativePath: string) => {
    if (this.isNodeModulePackage(relativePath)) {
      return relativePath
        .replace(/^(.*?\/)?node_modules\/(@types\/)?/, '')
        .replace(/\/index$/, '');
    }
    return this.toRelativeModuleSpecifier(relativePath);
  }

  private static isNodeModulePackage = (moduleSpecifier: string): boolean => {
    return moduleSpecifier.includes('/node_modules/')
      || (!existsSync(moduleSpecifier + '.ts') && !existsSync(moduleSpecifier + '.d.ts'));
  }

  private static toRelativeModuleSpecifier = (moduleSpecifier: string): string => {
    if (moduleSpecifier.match(/^..?\//)) {
      return moduleSpecifier;
    }
    return `./${moduleSpecifier}`;
  }
}
