import { Node, ParameterDeclaration, PropertySignature, SyntaxKind, UnionTypeNode } from "ts-morph";
import TypeHandler from "../type-handler/type-handler";

class Cleanup {
  static filterUnionType = (unionType: UnionTypeNode) => {
    const filtered = unionType
      .getTypeNodes()
      .map(n => n.getText())
      .reduce((t: string[], c) => !t.includes(c) ? t.concat(c) : t, [])
      .join(' | ');
    const newNode = unionType.replaceWithText(filtered);
    const union = newNode.getFirstDescendantByKind(SyntaxKind.UnionType);
    if (union) {
      this.filterUnionType(union);
    }
  }

  static removeUndefinedFromOptional = (declaration: PropertySignature | ParameterDeclaration) => {
    debugger;
    const typeNode = declaration.getTypeNode();
    if (Node.isUnionTypeNode(typeNode) && declaration.hasQuestionToken()) {
      const filtered = typeNode
        .getTypeNodes()
        .map(n => n.getText())
        .filter(n => n !== 'undefined')
        .join(' | ');
      TypeHandler.setSimpleType(declaration, filtered || 'unknown');
    }
  }
}

export default Cleanup;
