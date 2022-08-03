import {Node, ReturnTypedNode, TypedNode} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';

class TypeDeclarationChecker {
  static checkTypeNode = (node: Node & TypedNode) => {
    const currentType = node.getTypeNode()?.getText();
    if (currentType) {
      node.removeType();
      const originalType = TypeHandler.getType(node).getText();
      if (currentType !== originalType) {
        TypeHandler.setTypeFiltered(node, currentType);
      }
    }
  }

  static checkReturnTypeNode = (node: Node & ReturnTypedNode) => {
    const currentType = node.getReturnTypeNode()?.getText();
    if (currentType) {
      node.removeReturnType();
      const originalType = node.getReturnType().getText();
      if (currentType !== originalType) {
        TypeHandler.setReturnTypeFiltered(node, currentType);
      }
    }
  }
}

export default TypeDeclarationChecker;