import {Node, ParameterDeclaration, Type, TypedNode, TypeNode, VariableDeclaration} from "ts-morph";
import {TypeChecker} from "../helpers/type-checker/type-checker";

export class TypeHandler {
  static setType = (node: TypedNode & Node, type: Type): TypedNode & Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node))
      return this.setBindingNameType(node, type.getText());
    return node.setType(type.getText());
  }

  static setTypeFiltered = (node: TypedNode & Node, type: string): TypedNode & Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node))
      return this.setBindingNameType(node, this.getType(this.setBindingNameType(node, type)).getText());
    return this.setType(node, this.getType(this.setSimpleType(node, type)));
  }

  static setSimpleType = (node: TypedNode & Node, type: string): TypedNode & Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node))
      return this.setBindingNameType(node, type);
    return node.setType(type);
  }

  static getType = (node: Node): Type => {
    if (Node.isVariableDeclaration(node))
      return this.getVariableDeclarationType(node);
    return node.getType();
  }

  static getTypeNode = (node: TypedNode & Node): TypeNode => {
    const typeNode = node.getTypeNode();
    if (!typeNode) {
      const type = this.getType(node);
      return this.setType(node, type).getTypeNodeOrThrow();
    }
    return typeNode;
  }

  static getFilteredUnionTypes = (type: Type): Type[] => {
    const unionTypes = type.isUnion() ? type.getUnionTypes() : [type];
    return unionTypes.filter(t => !TypeChecker.isAny(t));
  }

  private static setBindingNameType = (declaration: VariableDeclaration | ParameterDeclaration, type: string): TypedNode & Node => {
    /*
    * declaration.setType() causes an error due to a bug in ts-morph
    * const {a, b} = simpleFunction();
    */
    declaration.getTypeNode() && declaration.removeType();
    const nameNode = declaration.getNameNode();
    if (Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode)) {
      return nameNode
        .replaceWithText(`${nameNode.getText()}: ${type}`)
        .getParentOrThrow() as TypedNode & Node;
    }
    return declaration.setType(type);
  }

  private static getVariableDeclarationType = (declaration: VariableDeclaration): Type => {
    /*
    * declaration.getType() causes an error due to a bug in the typescript api
    * const {a, b} = simpleFunction();
    */
    if (Node.isIdentifier(declaration))
      return declaration.getType();
    return declaration.getTypeNode()?.getType() || declaration.getInitializerOrThrow().getType();
  }
}
