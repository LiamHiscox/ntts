import {BinaryExpression, CallExpression, NewExpression, Node, SyntaxKind} from "ts-morph";

export class TypeInferenceValidator {
  static validateSetAccessorParent = (node: Node): Node | undefined => {
    const parent = node.getParent();
    if (Node.isBinaryExpression(parent) && parent.getLeft().getText() === node.getText())
      return parent;
    if (Node.isPropertyAccessExpression(parent) && parent.getName() === node.getText())
      return parent;
    return;
  }

  static validateCallExpressionParent = (node: Node): Node | undefined => {
    const parent = node.getParent();
    if (Node.isCallExpression(parent) && parent.getExpression().getText() === node.getText())
      return parent;
    if (Node.isPropertyAccessExpression(parent) && parent.getName() === node.getText())
      return parent;
    return;
  }

  static getBinaryAssignmentExpression = (node: Node | undefined): BinaryExpression | undefined => {
    if (Node.isBinaryExpression(node) && node.getOperatorToken().asKind(SyntaxKind.EqualsToken))
      return node;
    if (Node.isPropertyAccessExpression(node) || Node.isElementAccessExpression(node))
      return this.getBinaryAssignmentExpression(node.getParent());
    return;
  }

  static getCallExpression = (node: Node | undefined): CallExpression | undefined => {
    if (Node.isCallExpression(node))
      return node;
    if (Node.isPropertyAccessExpression(node) || Node.isElementAccessExpression(node))
      return this.getCallExpression(node.getParent());
    return;
  }

  static getNewExpression = (node: Node | undefined): NewExpression | undefined => {
    if (Node.isNewExpression(node))
      return node;
    if (Node.isPropertyAccessExpression(node) || Node.isElementAccessExpression(node))
      return this.getNewExpression(node.getParent());
    return;
  }
}
