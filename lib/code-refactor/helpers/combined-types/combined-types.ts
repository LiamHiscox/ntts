import {
  ArrowFunction,
  ClassDeclaration,
  ClassExpression,
  ElementAccessExpression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  MethodDeclaration,
  Node,
  PropertyAccessExpression,
  PropertyAssignment,
  PropertyDeclaration,
  PropertyName,
  VariableDeclaration
} from "ts-morph";

export type ClassKind = ClassDeclaration | ClassExpression;
export type FunctionKind = FunctionDeclaration | MethodDeclaration | FunctionExpression | ArrowFunction;
export type FieldDeclarationKind = VariableDeclaration | PropertyAssignment | PropertyDeclaration;

export const isFieldDeclaration = (node: Node | undefined): node is FieldDeclarationKind => {
  return Node.isVariableDeclaration(node) || Node.isPropertyDeclaration(node) || Node.isPropertyAssignment(node);
}

export const isPropertyName = (node: Node | undefined): node is PropertyName => {
  return Node.isIdentifier(node)
    || Node.isStringLiteral(node)
    || Node.isNumericLiteral(node)
    || Node.isComputedPropertyName(node)
    || Node.isPrivateIdentifier(node);
}

export type AccessExpressionKind = ElementAccessExpression | PropertyAccessExpression | Identifier;

export const isAccessExpression = (node: Node | undefined): node is AccessExpressionKind => {
  return Node.isElementAccessExpression(node) || Node.isPropertyAccessExpression(node) || Node.isIdentifier(node);
}
