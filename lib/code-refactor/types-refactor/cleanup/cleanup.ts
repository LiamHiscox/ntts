import {Node, SyntaxKind, TypedNode, UnionTypeNode} from "ts-morph";
import TypeHandler from "../type-handler/type-handler";

class Cleanup {
  static filterDuplicateTypes = (typedNode: TypedNode & Node) => {
    const typeNode = typedNode.getTypeNode();
    if (typeNode) {
      this.filterNode(typedNode);
      TypeHandler.setTypeFiltered(typedNode, TypeHandler.getTypeNode(typedNode).getText());
    }
  }

  private static filterNode = (node: Node) => {
    const unionType = node.getFirstDescendantByKind(SyntaxKind.UnionType);
    if (unionType) {
      const filtered = this.filterUnionType(unionType);
      const newUnionType = unionType.replaceWithText(filtered);
      this.filterNode(newUnionType);
    }
  }

  private static filterUnionType = (unionType: UnionTypeNode) => unionType
    .getTypeNodes()
    .map(t => t.getText())
    .reduce((acc: string[], cur) => !acc.includes(cur) ? acc.concat(cur) : acc, [])
    .join(' | ');
}

export default Cleanup;
