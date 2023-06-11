import {
  Node,
  ParameterDeclaration,
  PropertySignature,
  ReturnTypedNode,
  SyntaxKind,
  TypedNode,
  TypeNode,
  UnionTypeNode
} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';

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

  static removeUndefinedFromOptional = (declaration: PropertySignature | ParameterDeclaration, typeAlias: string) => {
    const typeNode = declaration.getTypeNode();
    if (Node.isUnionTypeNode(typeNode) && declaration.hasQuestionToken()) {
      const filtered = typeNode
        .getTypeNodes()
        .map(n => n.getText())
        .filter(n => n !== 'undefined')
        .join(' | ');
      TypeHandler.setSimpleType(declaration, filtered || typeAlias);
    }
  }

  static replaceNullOrUndefinedReturnType = (node: Node & ReturnTypedNode, typeAlias: string) => {
    if (this.checkTypeNode(node.getReturnTypeNode())) {
      TypeHandler.setReturnTypeFiltered(node, typeAlias);
    }
  }

  static replaceNullOrUndefinedType = (node: Node & TypedNode, typeAlias: string) => {
    if (this.checkTypeNode(node.getTypeNode())) {
      TypeHandler.setSimpleType(node, typeAlias);
    }
  }

  private static checkTypeNode = (typeNode?: TypeNode) => {
    if (typeNode && ['null', 'undefined'].includes(typeNode.getText())) {
      return true;
    }
    if (Node.isUnionTypeNode(typeNode)) {
      const types = typeNode
        .getTypeNodes()
        .map((t) => t.getText())
        .filter(t => t !== 'null' && t !== 'undefined');
      return types.length <= 0;
    }
    return false;
  }
}

export default Cleanup;
