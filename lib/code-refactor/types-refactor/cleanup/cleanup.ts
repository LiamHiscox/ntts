import {
  Node,
  ParameterDeclaration,
  PropertySignature,
  SyntaxKind,
  TypeNode,
  UnionTypeNode
} from "ts-morph";
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

  static removeNullOrUndefinedType = (typeNode: TypeNode | undefined) => {
    if (!typeNode) {
      return;
    }
    if (Node.isUnionTypeNode(typeNode)) {
      const types = typeNode
        .getTypeNodes()
        .map((t) => t.getText())
        .filter(t => t !== 'null' && t !== 'undefined');
      if (types.length <= 0) {
        typeNode.replaceWithText('unknown')
      }
    } else if (typeNode.getText() === 'null' || typeNode.getText() === 'undefined') {
      typeNode.replaceWithText('unknown');
    }
  }
}

export default Cleanup;
