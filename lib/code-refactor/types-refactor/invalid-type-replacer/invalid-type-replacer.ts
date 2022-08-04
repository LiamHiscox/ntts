import {Node, ParameterDeclaration, ReturnTypedNode, SyntaxKind, TypedNode, TypeNode} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';

class InvalidTypeReplacer {
  static replaceParameterType = (parameter: ParameterDeclaration, typeAlias: string) => {
    const type = TypeHandler.getType(parameter);
    if (type.isAny() || type.getText() === 'never' || type.getText() === 'unknown') {
      TypeHandler.setSimpleType(parameter, typeAlias);
    } else {
      this.replaceType(parameter, typeAlias);
    }
  }

  static replaceType = (typedNode: TypedNode & Node, typeAlias: string) => {
    const initialTypeNode = typedNode.getTypeNode();
    if (initialTypeNode) {
      return this.getInvalidTypeNodes(initialTypeNode)
        .forEach((node) => node.replaceWithText(typeAlias));
    }
    const typeNode = TypeHandler.getTypeNode(typedNode);
    if (this.containsNeverNodes(typeNode)) {
      this.getInvalidTypeNodes(typeNode)
        .forEach(node => node.replaceWithText(typeAlias));
    } else {
      typedNode.removeType();
    }
  }

  static replaceReturnType = (typedNode: ReturnTypedNode & Node, typeAlias: string) => {
    const initialTypeNode = typedNode.getReturnTypeNode();
    if (initialTypeNode) {
      return this.getInvalidTypeNodes(initialTypeNode)
        .forEach((node) => node.replaceWithText(typeAlias));
    }
    const typeNode = TypeHandler.getReturnTypeNode(typedNode);
    if (this.containsNeverNodes(typeNode)) {
      this.getInvalidTypeNodes(typeNode)
        .forEach(node => node.replaceWithText(typeAlias));
    } else {
      typedNode.removeReturnType();
    }
  }

  private static containsNeverNodes = (typeNode: TypeNode): boolean => {
    return Node.isNeverKeyword(typeNode) || !!typeNode.getFirstDescendantByKind(SyntaxKind.NeverKeyword);
  };

  private static getInvalidTypeNodes = (typeNode: TypeNode): Node[] => {
    if (Node.isNeverKeyword(typeNode) || Node.isAnyKeyword(typeNode) || !!typeNode.asKind(SyntaxKind.UnknownKeyword)) {
      return [typeNode];
    }
    return typeNode.getDescendants().filter((d) => Node.isNeverKeyword(d) || Node.isAnyKeyword(d) || !!d.asKind(SyntaxKind.UnknownKeyword));
  };
}

export default InvalidTypeReplacer;
