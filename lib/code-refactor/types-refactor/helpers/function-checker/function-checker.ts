import {
  ArrowFunction,
  ConstructorDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  FunctionTypeNode,
  MethodDeclaration,
  Node,
  ParameterDeclaration
} from "ts-morph";

type FunctionKind =
  ConstructorDeclaration
  | FunctionExpression
  | FunctionDeclaration
  | ArrowFunction
  | MethodDeclaration
  | FunctionTypeNode;

export const getParentFunction = (parameter: ParameterDeclaration): FunctionKind | undefined => {
  const ancestors = parameter.getAncestors();
  for (let i = 0; i < ancestors.length; i++) {
    const ancestor = ancestors[i];
    if (Node.isConstructorDeclaration(ancestor)
      || Node.isFunctionExpression(ancestor)
      || Node.isFunctionDeclaration(ancestor)
      || Node.isArrowFunction(ancestor)
      || Node.isMethodDeclaration(ancestor)
      || Node.isFunctionTypeNode(ancestor)) {
      return ancestor;
    }
  }
  return undefined;
}

const nonParenthesizedParent = (node: Node | undefined) => {
  if (Node.isParenthesizedExpression(node)) {
    nonParenthesizedParent(node.getParent());
  }
  return node;
}

export const isAnonymousFunction = (fun: FunctionKind | undefined): boolean => {
  if (Node.isArrowFunction(fun) || Node.isFunctionExpression(fun)) {
    const parent = nonParenthesizedParent(fun.getParent());
    return !Node.isVariableDeclaration(parent)
      && !Node.isPropertyDeclaration(parent)
      && !Node.isPropertyAssignment(parent);
  }
  return false;
}
