import {Node, ParameterDeclaration, Type, VariableDeclaration} from "ts-morph";

export class TypeHandler {
  static setType = (node: Node, type: Type): Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node))
      return this.setBindingNameType(node, type.getText());
    if (Node.isTyped(node))
      return node.setType(type.getText());
    return node;
  }

  static setSimpleType = (node: Node, type: string): Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node))
      return this.setBindingNameType(node, type);
    if (Node.isTyped(node))
      return node.setType(type);
    return node;
  }

  static getType = (node: Node): Type => {
    if (Node.isVariableDeclaration(node))
      return this.getVariableDeclarationType(node);
    return node.getType();
  }

  private static setBindingNameType = (declaration: VariableDeclaration | ParameterDeclaration, type: string): Node => {
    /*
    * declaration.setType() causes an error due to a bug in ts-morph
    * const {a, b} = simpleFunction();
    */
    const nameNode = declaration.getNameNode();
    if (Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode)) {
      return nameNode
        .replaceWithText(`${nameNode.getText()}: ${type}`)
        .getParentOrThrow();
    }
    return declaration.setType(type);
  }

  private static getVariableDeclarationType = (declaration: VariableDeclaration): Type => {
    /*
    * declaration.getType() causes an error due to a bug in the typescript api
    * const {a, b} = simpleFunction();
    */
    if (Node.isArrayBindingPattern(declaration.getNameNode()) || Node.isObjectBindingPattern(declaration.getNameNode())) {
      return declaration.getInitializerOrThrow().getType();
    }
    return declaration.getType();
  }
}
