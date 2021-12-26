import {
  ElementAccessExpression, Node, PropertyAccessExpression, PropertyName, SyntaxKind,
} from 'ts-morph';
import { isAccessExpression } from '../combined-types/combined-types';

export const getInnerExpression = (node: Node | undefined) => {
  if (Node.isParenthesizedExpression(node)) {
    getInnerExpression(node.getExpression());
  }
  return node;
};

export const getExpressionParent = (node: Node | undefined): Node | undefined => {
  const parent = node?.getParent();
  if (Node.isPropertyAccessExpression(parent)
    || Node.isElementAccessExpression(parent)
    || Node.isParenthesizedExpression(parent)) {
    return getExpressionParent(parent);
  }
  return getInnerExpression(node);
};

export const isAccessExpressionTarget = (expression: PropertyAccessExpression | ElementAccessExpression | PropertyName, target: Node): boolean => {
  if (Node.isPropertyAccessExpression(expression)) {
    return expression.getNameNode().getPos() === target.getPos();
  }
  if (Node.isElementAccessExpression(expression)) {
    return expression.getArgumentExpression()?.getPos() === target.getPos();
  }
  return expression.getPos() === target.getPos();
};

export const isWriteAccess = (node: Node): boolean => {
  const innerExpression = getExpressionParent(node);
  if (isAccessExpression(innerExpression) && isAccessExpressionTarget(innerExpression, node)) {
    const binary = node.getFirstAncestorByKind(SyntaxKind.BinaryExpression);
    const left = binary?.getLeft();
    const inner = getInnerExpression(left);
    return !!binary?.getOperatorToken().asKind(SyntaxKind.EqualsToken) && innerExpression.getPos() === inner?.getPos();
  }
  return false;
};
