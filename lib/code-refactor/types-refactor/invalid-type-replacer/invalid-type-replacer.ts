import { Node, TypedNode, TypeNode } from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import TypeChecker from '../helpers/type-checker/type-checker';

class InvalidTypeReplacer {
  static replaceAnyAndNeverType = (typedNode: TypedNode & Node): void => {
    if (TypeChecker.isAnyOrUnknown(TypeHandler.getType(typedNode))) {
      TypeHandler.setSimpleType(typedNode, 'unknown');
    } else {
      const initialTypeNode = typedNode.getTypeNode();
      const typeNode = initialTypeNode || TypeHandler.getTypeNode(typedNode);
      const replaceableNodes = this.getNeverNodes(typeNode);
      if (replaceableNodes.length > 0) {
        replaceableNodes.forEach((node) => node.replaceWithText('unknown'));
      } else if (!initialTypeNode) {
        typedNode.removeType();
      }
    }
  };

  private static getNeverNodes = (typeNode: TypeNode): Node[] => {
    if (Node.isNeverKeyword(typeNode)) {
      return [typeNode];
    }
    return typeNode.getDescendants().filter((d) => Node.isNeverKeyword(d));
  };
}

export default InvalidTypeReplacer;
