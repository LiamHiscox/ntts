import {Node, SyntaxKind, TypedNode, UnionTypeNode} from "ts-morph";
import TypeHandler from "../type-handler/type-handler";

class Cleanup {
  static filterDuplicateTypes = (typedNode: TypedNode & Node) => {
    const typeNode = typedNode.getTypeNode();
    const unionType = Node.isUnionTypeNode(typeNode) ? typeNode : typeNode?.getFirstDescendantByKind(SyntaxKind.UnionType);
    if (typeNode && unionType) {
      const filtered = this.filterUnionType(unionType);
      TypeHandler.setTypeFiltered(typedNode, filtered);
      this.filterDuplicateTypes(typedNode);
    }
  }

  private static filterUnionType = (unionType: UnionTypeNode) => unionType
    .getTypeNodes()
    .map(t => t.getText())
    .reduce((acc: string[], cur) => !acc.includes(cur) ? acc.concat(cur) : acc, [])
    .join(' | ');
}

export default Cleanup;
