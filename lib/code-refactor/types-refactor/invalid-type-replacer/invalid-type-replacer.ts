import {TypeHandler} from "../type-handler/type-handler";
import {Node, ReturnTypedNode, TypedNode, TypeNode} from "ts-morph";

export class InvalidTypeReplacer {
  static replaceAnyAndNeverReturnType = (typedNode: ReturnTypedNode & Node) => {
    const initialTypeNode = typedNode.getReturnTypeNode();
    const typeNode = initialTypeNode || TypeHandler.getReturnTypeNode(typedNode);
    const replaceableNodes = this.getReplaceableNodes(typeNode);
    if (replaceableNodes.length > 0) {
      replaceableNodes.forEach(node => node.replaceWithText('unknown'));
      // typedNode.setReturnType(typedNode.getReturnType().getText());
    } else if (!initialTypeNode) {
      typedNode.removeReturnType();
    }
  }

  static replaceAnyAndNeverType = (typedNode: TypedNode & Node) => {
    const initialTypeNode = typedNode.getTypeNode();
    const typeNode = initialTypeNode || TypeHandler.getTypeNode(typedNode);
    const replaceableNodes = this.getReplaceableNodes(typeNode);
    if (replaceableNodes.length > 0) {
      replaceableNodes.forEach(node => node.replaceWithText('unknown'));
      // TypeHandler.setType(typedNode, TypeHandler.getType(typedNode));
    } else if (!initialTypeNode) {
      typedNode.removeType();
    }
  }

  private static getReplaceableNodes = (typeNode: TypeNode): Node[] => {
    if (Node.isAnyKeyword(typeNode) || Node.isNeverKeyword(typeNode))
      return [typeNode];
    return typeNode.getDescendants().filter(d => Node.isAnyKeyword(d) || Node.isNeverKeyword(d));
  }
}
