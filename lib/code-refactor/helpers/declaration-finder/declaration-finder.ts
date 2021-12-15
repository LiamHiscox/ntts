import {
  ArrowFunction,
  ClassDeclaration,
  ClassExpression,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  MethodDeclaration,
  Node,
  PropertyAccessExpression
} from "ts-morph";
import {ClassKind, FunctionKind, isFieldDeclaration} from "../combined-types/combined-types";
import {findReferences} from "../reference-finder/reference-finder";


export class DeclarationFinder {
  static getClassOrFunction = (nameNode: Identifier | PropertyAccessExpression): ClassKind | FunctionKind | undefined => {
    const references = findReferences(nameNode).map(reference => reference.getDefinition().getDeclarationNode());
    const result = references.reduce((acc: ClassKind | FunctionKind | undefined, node) =>
      this.getClassOrFunctionDeclarationOrExpression(node) || acc, undefined);
    if (result)
      return result;

    const last = references.length > 0 ? references[references.length - 1] : undefined;
    if (Node.isExportAssignment(last))
      return this.getClassOrFunctionFromExportAssignment(last.getExpression());
    if (Node.isExportSpecifier(last) || Node.isImportSpecifier(last))
      return this.getClassOrFunction(last.getNameNode());
    const grandParent = last?.getParent();
    if (Node.isImportClause(last) && Node.isImportDeclaration(grandParent) && last.getDefaultImport())
      return this.getClassOrFunctionFromDefaultExport(grandParent);
    return;
  }

  private static getClassOrFunctionFromExportAssignment = (expression: Expression): ClassKind | FunctionKind | undefined => {
    if (Node.isIdentifier(expression) || Node.isPropertyAccessExpression(expression))
      return this.getClassOrFunction(expression);
    if (this.isClassOrFunctionExpression(expression))
      return expression;
    return;
  }

  private static getClassOrFunctionFromDefaultExport = (importDeclaration: ImportDeclaration): ClassKind | FunctionKind | undefined => {
    const sourceFile = importDeclaration.getModuleSpecifierSourceFile();
    const declarations = sourceFile?.getDefaultExportSymbol()?.getDeclarations();
    if (!sourceFile || sourceFile.isInNodeModules() || sourceFile.isFromExternalLibrary())
      return;
    if (!declarations || declarations.length <= 0)
      return;
    const first = declarations[0];
    if (this.isClassOrFunctionDeclaration(first))
      return first;
    if (Node.isExportAssignment(first))
      return this.getClassOrFunctionFromExportAssignment(first.getExpression());
    return;
  }

  private static getClassOrFunctionDeclarationOrExpression = (node: Node | undefined): ClassKind | FunctionKind | undefined => {
    if (this.isClassOrFunctionDeclaration(node))
      return node;
    if (isFieldDeclaration(node)) {
      const initializer = node.getInitializer();
      return this.isClassOrFunctionExpression(initializer) ? initializer : undefined;
    }
    return;
  }

  private static isClassOrFunctionExpression = (node: Node | undefined): node is (ClassExpression | FunctionExpression | ArrowFunction) => {
    return Node.isFunctionExpression(node) || Node.isArrowFunction(node) || Node.isClassExpression(node);
  }

  private static isClassOrFunctionDeclaration = (node: Node | undefined): node is (ClassDeclaration | FunctionDeclaration | MethodDeclaration) => {
    return Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node) || Node.isClassDeclaration(node);
  }
}
