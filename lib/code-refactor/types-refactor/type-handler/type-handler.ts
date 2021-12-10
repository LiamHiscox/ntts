import {
  Node,
  ParameterDeclaration,
  PropertyDeclaration, ReturnTypedNode,
  Type,
  TypedNode,
  TypeNode,
  VariableDeclaration
} from "ts-morph";
import {TypeChecker} from "../helpers/type-checker/type-checker";

export class TypeHandler {
  static setType = (node: TypedNode & Node, type: Type): TypedNode & Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node) || Node.isPropertyDeclaration(node))
      return this.setBindingNameType(node, type.getBaseTypeOfLiteralType().getText());
    return node.setType(type.getBaseTypeOfLiteralType().getText());
  }

  static setTypeFiltered = (node: TypedNode & Node, type: string): TypedNode & Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node) || Node.isPropertyDeclaration(node))
      return this.setBindingNameType(node, this.getType(this.setBindingNameType(node, type)).getText());
    return this.setType(node, this.getType(this.setSimpleType(node, type)));
  }

  static setSimpleType = (node: TypedNode & Node, type: string): TypedNode & Node => {
    if (Node.isVariableDeclaration(node) || Node.isParameterDeclaration(node) || Node.isPropertyDeclaration(node))
      return this.setBindingNameType(node, type);
    return node.setType(type);
  }

  static addTypes = (node: TypedNode & Node, ...types: string[]): TypedNode & Node => {
    const type = TypeHandler.getType(node).getBaseTypeOfLiteralType();
    if (type.isAny() && types.length > 0)
      return TypeHandler.setTypeFiltered(node, types.join(' | '));
    if (types.length > 0)
      return TypeHandler.setTypeFiltered(node, `${type.getText()} | ${types.join(' | ')}`);
    return node;
  }

  static addType = (node: TypedNode & Node, type: string): TypedNode & Node => {
    const existingType = this.getType(node).getBaseTypeOfLiteralType();
    if (!TypeChecker.isAny(existingType) && existingType.getText() !== type)
      return this.setTypeFiltered(node, `${existingType.getText()} | ${type}`);
    return this.setTypeFiltered(node, type);
  }

  static addArrayType = (node: TypedNode & Node, type: string): TypedNode & Node => {
    const existingType = this.getType(node).getBaseTypeOfLiteralType();
    if (TypeChecker.isAny(existingType)) {
      return this.setTypeFiltered(node, type);
    }
    const existingTypeNode = this.getTypeNode(node);
    if (Node.isUnionTypeNode(existingTypeNode)) {
      const newType = existingTypeNode.getTypeNodes().map(t => t.getText()).concat(`${type}[]`).join(' | ');
      return this.setTypeFiltered(node, newType);
    }
    return this.setTypeFiltered(node, `${existingTypeNode.getText()} | ${type}`);
  }

  static getType = (node: Node): Type => {
    if (Node.isVariableDeclaration(node))
      return this.getVariableDeclarationType(node).getBaseTypeOfLiteralType();
    return node.getType().getBaseTypeOfLiteralType();
  }

  static getTypeNode = (node: TypedNode & Node): TypeNode => {
    const typeNode = node.getTypeNode();
    if (!typeNode) {
      const type = this.getType(node).getBaseTypeOfLiteralType();
      return this.setType(node, type).getTypeNodeOrThrow();
    }
    return typeNode;
  }

  static getReturnTypeNode = (node: ReturnTypedNode & Node): TypeNode => {
    const typeNode = node.getReturnTypeNode();
    if (!typeNode) {
      const type = this.getType(node).getBaseTypeOfLiteralType();
      return node.setReturnType(type.getText()).getReturnTypeNodeOrThrow();
    }
    return typeNode;
  }

  static setReturnTypeFiltered = (node: ReturnTypedNode & Node, type: string): ReturnTypedNode & Node => {
    const returnType = node.setReturnType(type).getReturnType();
    return node.setReturnType(returnType.getText());
  }

  static combineTypeWithList = (type: Type, ...types: string[]): string | undefined => {
    const baseType = type.getBaseTypeOfLiteralType();
    if (baseType.isAny() && types.length > 0)
      return types.join(' | ');
    if (types.length > 0)
      return `${baseType.getText()} | ${types.join(' | ')}`;
    return;
  }

  static getFilteredUnionTypes = (type: Type): Type[] => {
    const unionTypes = type.isUnion() ? type.getUnionTypes() : [type];
    return unionTypes.filter(t => !TypeChecker.isAny(t)).map(t => t.getBaseTypeOfLiteralType());
  }

  private static setBindingNameType = (declaration: VariableDeclaration | ParameterDeclaration | PropertyDeclaration, type: string): TypedNode & Node => {
    /*
    * declaration.setType() causes an error due to a bug in ts-morph
    * const {a, b} = simpleFunction();
    */
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
        .getParentOrThrow() as TypedNode & Node;
    }
    return declaration.setType(type);
  }

  private static getVariableDeclarationType = (declaration: VariableDeclaration): Type => {
    /*
    * declaration.getType() causes an error due to a bug in the typescript api
    * const {a, b} = simpleFunction();
    */
    if (Node.isIdentifier(declaration.getNameNode()))
      return declaration.getType().getBaseTypeOfLiteralType();
    return declaration.getTypeNode()?.getType().getBaseTypeOfLiteralType() || declaration.getInitializerOrThrow().getType().getBaseTypeOfLiteralType();
  }
}
