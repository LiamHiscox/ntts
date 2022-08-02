import {
  Node,
  ParameterDeclaration,
  ReturnTypedNode,
  SyntaxKind,
  TypedNode,
  TypeNode
} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import {typeAliasName} from "../interface-handler/interface-creator/interface-creator";

class InvalidTypeReplacer {
  static replaceParameterType = (parameter: ParameterDeclaration) => {
    const type = TypeHandler.getType(parameter);
    if (type.isAny() || type.getText() === 'never') {
      TypeHandler.setSimpleType(parameter, 'unknown');
    } else {
      this.replaceType(parameter);
    }
  }

  static replaceType = (typedNode: TypedNode & Node) => {
    const initialTypeNode = typedNode.getTypeNode();
    if (initialTypeNode) {
      return this.getNeverAndAnyNodes(initialTypeNode).forEach((node) => node.replaceWithText('unknown'));
    }
    const typeNode = TypeHandler.getTypeNode(typedNode);
    if (this.containsNeverNodes(typeNode)) {
      this.getNeverAndAnyNodes(typeNode).forEach(node => node.replaceWithText(typeAliasName));
    } else {
      typedNode.removeType();
    }
  }

  static replaceReturnType = (typedNode: ReturnTypedNode & Node) => {
    const initialTypeNode = typedNode.getReturnTypeNode();
    if (initialTypeNode) {
      return this.getNeverAndAnyNodes(initialTypeNode).forEach((node) => node.replaceWithText(typeAliasName));
    }
    const typeNode = TypeHandler.getReturnTypeNode(typedNode);
    if (this.containsNeverNodes(typeNode)) {
      this.getNeverAndAnyNodes(typeNode).forEach(node => node.replaceWithText(typeAliasName));
    } else {
      typedNode.removeReturnType();
    }
  }

  private static containsNeverNodes = (typeNode: TypeNode): boolean => {
    return Node.isNeverKeyword(typeNode) || !!typeNode.getFirstDescendantByKind(SyntaxKind.NeverKeyword);
  };

  private static getNeverAndAnyNodes = (typeNode: TypeNode): Node[] => {
    if (Node.isNeverKeyword(typeNode) || Node.isAnyKeyword(typeNode)) {
      return [typeNode];
    }
    return typeNode.getDescendants().filter((d) => Node.isNeverKeyword(d) || Node.isAnyKeyword(d));
  };
}

export default InvalidTypeReplacer;
