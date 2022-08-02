import {
  Node,
  ParameterDeclaration, Project,
  PropertySignature,
  SyntaxKind,
  TypeNode,
  UnionTypeNode
} from 'ts-morph';
import TypeHandler from '../type-handler/type-handler';
import { getTypeAliasType } from '../interface-handler/interface-creator/interface-creator';

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

  static removeUndefinedFromOptional = (declaration: PropertySignature | ParameterDeclaration, project: Project, target: string) => {
    const typeNode = declaration.getTypeNode();
    if (Node.isUnionTypeNode(typeNode) && declaration.hasQuestionToken()) {
      const filtered = typeNode
        .getTypeNodes()
        .map(n => n.getText())
        .filter(n => n !== 'undefined')
        .join(' | ');
      TypeHandler.setSimpleType(declaration, filtered || getTypeAliasType(project, target));
    }
  }

  static removeNullOrUndefinedType = (typeNode: TypeNode | undefined, project: Project, target: string) => {
    if (!typeNode) {
      return;
    }
    if (Node.isUnionTypeNode(typeNode)) {
      const types = typeNode
        .getTypeNodes()
        .map((t) => t.getText())
        .filter(t => t !== 'null' && t !== 'undefined');
      if (types.length <= 0) {
        typeNode.replaceWithText(getTypeAliasType(project, target))
      }
    } else if (typeNode.getText() === 'null' || typeNode.getText() === 'undefined') {
      typeNode.replaceWithText(getTypeAliasType(project, target));
    }
  }
}

export default Cleanup;
