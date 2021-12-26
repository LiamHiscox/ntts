import {
  BinaryExpression, CallExpression, NewExpression, Node, SyntaxKind,
} from 'ts-morph';

class TypeInferenceValidator {
  private static validateBinaryExpression = (node: Node, parent: Node | undefined): boolean => {
    return !!Node.isBinaryExpression(parent)
      && parent.getLeft().getPos() === node.getPos()
      && !!parent.getOperatorToken().asKind(SyntaxKind.EqualsToken)
  }

  static validateSetAccessorParent = (node: Node): Node | undefined => {
    const parent = node.getParent();
    if (this.validateBinaryExpression(node, parent)) {
      return parent;
    }
    const grandParent = parent?.getParent();
    if (Node.isPropertyAccessExpression(parent)
      && parent.getNameNode().getPos() === node.getPos()
      && this.validateBinaryExpression(parent, grandParent)) {
      return parent;
    }
    return undefined;
  };

  private static validateCallExpression = (node: Node, parent: Node | undefined): boolean => {
    return Node.isCallExpression(parent) && parent.getExpression().getPos() === node.getPos();
  }

  static validateCallExpressionParent = (node: Node): Node | undefined => {
    const parent = node.getParent();
    if (this.validateCallExpression(node, parent)) {
      return parent;
    }
    const grandParent = parent?.getParent();
    if (Node.isPropertyAccessExpression(parent)
      && parent.getNameNode().getPos() === node.getPos()
      && this.validateCallExpression(parent, grandParent)) {
      return parent;
    }
    return undefined;
  };

  static getBinaryAssignmentExpression = (node: Node | undefined): BinaryExpression | undefined => {
    if (Node.isBinaryExpression(node) && node.getOperatorToken().asKind(SyntaxKind.EqualsToken)) {
      return node;
    }
    if (Node.isPropertyAccessExpression(node) || Node.isElementAccessExpression(node)) {
      return this.getBinaryAssignmentExpression(node.getParent());
    }
    return undefined;
  };

  static getCallExpression = (node: Node | undefined): CallExpression | undefined => {
    if (Node.isCallExpression(node)) {
      return node;
    }
    if (Node.isPropertyAccessExpression(node) || Node.isElementAccessExpression(node)) {
      return this.getCallExpression(node.getParent());
    }
    return undefined;
  };

  static getNewExpression = (node: Node | undefined): NewExpression | undefined => {
    if (Node.isNewExpression(node)) {
      return node;
    }
    if (Node.isPropertyAccessExpression(node) || Node.isElementAccessExpression(node)) {
      return this.getNewExpression(node.getParent());
    }
    return undefined;
  };
}

export default TypeInferenceValidator;
