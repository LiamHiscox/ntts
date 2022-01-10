import { Node, TypedNode } from "ts-morph";
import TypeHandler from "../type-handler/type-handler";

class Cleanup {
  static filterDuplicateTypes = (typedNode: TypedNode & Node) => {
    const typeNode = typedNode.getTypeNode();
    if (typeNode) {
      TypeHandler.setType(typedNode, TypeHandler.getType(typedNode));
    }
  }
}

export default Cleanup;
