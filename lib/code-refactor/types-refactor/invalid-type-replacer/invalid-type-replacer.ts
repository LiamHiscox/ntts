import {
  Node,
  ParameterDeclaration, Project,
  ReturnTypedNode,
  SyntaxKind,
  TypedNode,
  TypeNode
} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import {getTypeAliasType} from '../interface-handler/interface-creator/interface-creator';

class InvalidTypeReplacer {
  static replaceParameterType = (parameter: ParameterDeclaration, project: Project, target: string) => {
    const type = TypeHandler.getType(parameter);
    if (type.isAny() || type.getText() === 'never') {
      TypeHandler.setSimpleType(parameter, 'unknown');
    } else {
      this.replaceType(parameter, project, target);
    }
  }

  static replaceType = (typedNode: TypedNode & Node, project: Project, target: string) => {
    const initialTypeNode = typedNode.getTypeNode();
    if (initialTypeNode) {
      return this.getNeverAndAnyNodes(initialTypeNode).forEach((node) => node.replaceWithText('unknown'));
    }
    const typeNode = TypeHandler.getTypeNode(typedNode);
    if (this.containsNeverNodes(typeNode)) {
      this.getNeverAndAnyNodes(typeNode).forEach(node => node.replaceWithText(getTypeAliasType(project, target)));
    } else {
      typedNode.removeType();
    }
  }

  static replaceReturnType = (typedNode: ReturnTypedNode & Node, project: Project, target: string) => {
    const initialTypeNode = typedNode.getReturnTypeNode();
    if (initialTypeNode) {
      return this.getNeverAndAnyNodes(initialTypeNode).forEach((node) => node.replaceWithText(getTypeAliasType(project, target)));
    }
    const typeNode = TypeHandler.getReturnTypeNode(typedNode);
    if (this.containsNeverNodes(typeNode)) {
      this.getNeverAndAnyNodes(typeNode).forEach(node => node.replaceWithText(getTypeAliasType(project, target)));
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
