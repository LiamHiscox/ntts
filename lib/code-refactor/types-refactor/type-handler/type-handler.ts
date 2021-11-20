import {Node, ParameterDeclaration, SyntaxKind, Type, VariableDeclaration} from "ts-morph";

export class TypeHandler {
  static setType = (node: Node, type: Type): Node => {
    Node.isTypedNode(node);
    switch (node.getKind()) {
      case SyntaxKind.VariableDeclaration:
        return this.setBindingNameType(node.asKindOrThrow(SyntaxKind.VariableDeclaration), type);
      case SyntaxKind.Parameter:
        return this.setBindingNameType(node.asKindOrThrow(SyntaxKind.Parameter), type);
      default:
        if (Node.isTypedNode(node)) {
          return node.setType(type.getText());
        }
        return node;
    }
  }

  static getType = (node: Node): Type => {
    switch (node.getKind()) {
      case SyntaxKind.VariableDeclaration:
        return this.getVariableDeclarationType(node.asKindOrThrow(SyntaxKind.VariableDeclaration));
      default:
        return node.getType();
    }
  }

  private static setBindingNameType = (declaration: VariableDeclaration | ParameterDeclaration, type: Type): Node => {
    const nameNode = declaration.getNameNode();
    switch (nameNode.getKind()) {
      /*
      * declaration.setType() causes an error due to a bug in ts-morph
      * const {a, b} = simpleFunction();
      */
      case SyntaxKind.ArrayBindingPattern:
      case SyntaxKind.ObjectBindingPattern:
        return nameNode
          .replaceWithText(`${nameNode.getText()}: ${type.getText()}`)
          .getParentOrThrow();
      case SyntaxKind.Identifier:
      default:
        return declaration.setType(type.getText());
    }
  }

  private static getVariableDeclarationType = (declaration: VariableDeclaration): Type => {
    switch (declaration.getNameNode().getKind()) {
      /*
      * declaration.getType() causes an error due to a bug in the typescript api
      * const {a, b} = simpleFunction();
      */
      case SyntaxKind.ArrayBindingPattern:
      case SyntaxKind.ObjectBindingPattern:
        return declaration.getInitializerOrThrow().getType();
      case SyntaxKind.Identifier:
      default:
        return declaration.getType();
    }
  }
}
