import {
  Node,
  ParameterDeclaration,
  PropertyDeclaration,
  ReturnTypedNode,
  Type,
  TypedNode,
  TypeNode,
  VariableDeclaration,
} from 'ts-morph';
import TypeChecker from '../helpers/type-checker/type-checker';

class TypeHandler {
  static setType = <T extends Node & TypedNode>(node: T, type: Type): T => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node) || Node.isPropertyDeclaration(node)) {
      return this.setBindingNameType(node, type.getBaseTypeOfLiteralType().getText());
    }
    return node.setType(type.getBaseTypeOfLiteralType().getText());
  };

  static setTypeFiltered = <T extends Node & TypedNode>(node: T, type: string): T => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node) || Node.isPropertyDeclaration(node)) {
      return this.setBindingNameType(node, this.getType(this.setBindingNameType(node, type)).getText());
    }
    return this.setType(node, this.getType(this.setSimpleType(node, type)));
  };

  static setSimpleType = <T extends Node & TypedNode>(node: T, type: string): T => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node) || Node.isPropertyDeclaration(node)) {
      return this.setBindingNameType(node, type);
    }
    return node.setType(type);
  };

  static addTypes = <T extends Node & TypedNode>(node: T, ...types: string[]): T => {
    const type = TypeHandler.getType(node).getBaseTypeOfLiteralType();
    if (TypeChecker.isAnyOrUnknown(type) && types.length > 0) {
      return TypeHandler.setTypeFiltered(node, types.map((t) => `(${t})`).join(' | '));
    }
    if (types.length > 0) {
      return TypeHandler.setTypeFiltered(node, `(${type.getText()}) | ${types.map((t) => `(${t})`).join(' | ')}`);
    }
    return node;
  };

  static getType = (node: Node): Type => {
    if (Node.isVariableDeclaration(node)) {
      return this.getVariableDeclarationType(node).getBaseTypeOfLiteralType();
    }
    return node.getType().getBaseTypeOfLiteralType();
  };

  static getTypeNode = (node: TypedNode & Node): TypeNode => {
    const typeNode = node.getTypeNode();
    if (!typeNode) {
      const type = this.getType(node).getBaseTypeOfLiteralType();
      return this.setType(node, type).getTypeNodeOrThrow();
    }
    return typeNode;
  };

  static getReturnTypeNode = (node: ReturnTypedNode & Node): TypeNode => {
    const typeNode = node.getReturnTypeNode();
    if (!typeNode) {
      const type = node.getReturnType().getBaseTypeOfLiteralType();
      return this.getNonParenthesizedType(node.setReturnType(type.getText()).getReturnTypeNodeOrThrow());
    }
    return this.getNonParenthesizedType(typeNode);
  };

  static setReturnTypeFiltered = <T extends Node & ReturnTypedNode>(node: T, type: string): T => {
    const returnType = node.setReturnType(type).getReturnType();
    return node.setReturnType(returnType.getText());
  };

  static combineTypes = (type1: Type, type2: Type): string => {
    if (TypeChecker.isAnyOrUnknown(type1)) {
      return type2.getText();
    }
    if (TypeChecker.isAnyOrUnknown(type2)) {
      return type1.getText();
    }
    return `(${type1.getText()}) | (${type2.getText()})`;
  };

  static combineTypeWithList = (type: Type, ...types: string[]): string => {
    const baseType = type.getBaseTypeOfLiteralType();
    if (TypeChecker.isAnyOrUnknown(baseType) && types.length > 0) {
      return types.map((t) => `(${t})`).join(' | ');
    }
    if (types.length > 0) {
      return `(${baseType.getText()}) | ${types.map((t) => `(${t})`).join(' | ')}`;
    }
    return type.getText();
  };

  static getFilteredUnionTypes = (type: Type): Type[] => {
    const unionTypes = type.isUnion() ? type.getUnionTypes() : [type];
    return unionTypes.filter((t) => !TypeChecker.isAny(t)).map((t) => t.getBaseTypeOfLiteralType());
  };

  static getNonParenthesizedType = (typeNode: TypeNode): TypeNode => {
    if (Node.isParenthesizedTypeNode(typeNode)) {
      return this.getNonParenthesizedType(typeNode.getTypeNode());
    }
    return typeNode;
  };

  private static setBindingNameType = <T extends (VariableDeclaration | ParameterDeclaration | PropertyDeclaration)>(
    declaration: T,
    type: string,
  ): T => {
    declaration.getTypeNode() && declaration.removeType();
    const nameNode = declaration.getNameNode();
    if (Node.isArrayBindingPattern(nameNode)
      || Node.isObjectBindingPattern(nameNode)
      || Node.isStringLiteral(nameNode)
      || Node.isNumericLiteral(nameNode)
      || Node.isComputedPropertyName(nameNode)
    ) {
      return nameNode
        .replaceWithText(`${nameNode.getText()}: ${type}`)
        .getParentOrThrow() as T;
    }
    return declaration.setType(type) as T;
  };

  private static getVariableDeclarationType = (declaration: VariableDeclaration): Type => {
    if (Node.isIdentifier(declaration.getNameNode())) {
      return declaration.getType().getBaseTypeOfLiteralType();
    }
    return declaration.getTypeNode()?.getType().getBaseTypeOfLiteralType()
      || declaration.getInitializerOrThrow().getType().getBaseTypeOfLiteralType();
  };
}

export default TypeHandler;
