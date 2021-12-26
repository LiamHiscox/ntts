import {
  BindingName,
  InterfaceDeclaration,
  Node,
  ParameterDeclaration,
  Project,
  PropertyDeclaration,
  PropertyName,
  TypeLiteralNode,
  TypeNode, UnionTypeNode,
  VariableDeclaration,
} from 'ts-morph';
import { createInterface, getInterfaces } from './interface-creator/interface-creator';
import TypeHandler from '../type-handler/type-handler';
import TypeSimplifier from '../helpers/type-simplifier/type-simplifier';
import InterfaceFinder from './interface-finder/interface-finder';

type DeclarationKind = VariableDeclaration | ParameterDeclaration | PropertyDeclaration;
type NameNodeKind = PropertyName | BindingName;

class InterfaceHandler {
  static createInterfaceFromObjectLiterals = (declaration: DeclarationKind, project: Project, target: string) => {
    const initializer = declaration.getInitializer();
    if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
      return;
    }
    const initialTypeNode = declaration.getTypeNode();
    const typeNode = initialTypeNode || TypeHandler.getTypeNode(declaration);
    const nameNode = declaration.getNameNode();
    const typeLiteral = InterfaceFinder.getFirstTypeLiteral(typeNode);
    if (typeLiteral) {
      this.checkTypeLiteral(typeLiteral, declaration, nameNode, project, target);
    } else if (!initialTypeNode) {
      declaration.removeType();
    }
  };

  static validateDeclaration = (declaration: DeclarationKind) => {
    const initializer = declaration.getInitializer();
    return !initializer || (!Node.isArrowFunction(initializer) && !Node.isFunctionExpression(initializer));
  }

  private static checkTypeLiteral = (
    typeLiteral: TypeLiteralNode,
    declaration: DeclarationKind,
    nameNode: NameNodeKind,
    project: Project,
    target: string,
  ) => {
    const parent = typeLiteral.getParent();
    if (Node.isUnionTypeNode(parent)) {
      this.checkUnionTypeNode(parent, declaration, nameNode, project, target);
    } else {
      const interfaceName = this.getInterfaceName(nameNode);
      const interfaceDeclaration = createInterface(interfaceName, project, target, typeLiteral.getMembers());
      typeLiteral.replaceWithText(TypeHandler.getType(interfaceDeclaration).getText());
      TypeHandler.setType(declaration, TypeHandler.getType(declaration));
      this.createInterfaceFromObjectLiterals(declaration, project, target);
    }
  };

  private static checkUnionTypeNode = (
    unionTypeNode: UnionTypeNode,
    declaration: DeclarationKind,
    nameNode: NameNodeKind,
    project: Project,
    target: string,
  ) => {
    const interfaces = getInterfaces(project, target);
    const typeNodes = unionTypeNode.getTypeNodes();
    const nonTypeLiterals = InterfaceFinder.getNonTypeLiteralNodes(typeNodes, interfaces);
    const interfaceDeclarations = InterfaceFinder.getInterfaceDeclarations(typeNodes, interfaces);
    const typeLiteralNodes = InterfaceFinder.getTypeLiteralNodes(typeNodes);
    if (interfaceDeclarations.length <= 0) {
      const interfaceName = this.getInterfaceName(nameNode);
      const [first, ...literals] = typeLiteralNodes;
      const interfaceDeclaration = createInterface(interfaceName, project, target, first.getMembers());
      this.addPropertiesToInterface(interfaceDeclaration, literals, nonTypeLiterals, unionTypeNode, declaration, project, target);
    } else {
      interfaceDeclarations.forEach((i) =>
        this.addPropertiesToInterface(i, typeLiteralNodes, nonTypeLiterals, unionTypeNode, declaration, project, target));
    }
  };

  private static addPropertiesToInterface = (
    interfaceDeclaration: InterfaceDeclaration,
    typeLiterals: TypeLiteralNode[],
    nonTypeLiterals: TypeNode[],
    typeNode: TypeNode,
    declaration: DeclarationKind,
    project: Project,
    target: string,
  ) => {
    const combined = typeLiterals
      .reduce((c: InterfaceDeclaration, literal) => TypeSimplifier.combineTypeLiterals(c, literal), interfaceDeclaration);
    const simplifiedType = nonTypeLiterals
      .map((c) => c.getText())
      .concat(TypeHandler.getType(combined).getText()).join(' | ');
    typeNode.replaceWithText(simplifiedType);
    TypeHandler.setType(declaration, TypeHandler.getType(declaration));
    this.createInterfaceFromObjectLiterals(declaration, project, target);
  };

  private static getInterfaceName = (nameNode: BindingName | PropertyName) => {
    if (Node.isIdentifier(nameNode) || Node.isPrivateIdentifier(nameNode) || Node.isStringLiteral(nameNode)) {
      return nameNode.getText();
    }
    if (Node.isObjectBindingPattern(nameNode)) {
      return 'ObjectBinding';
    }
    if (Node.isArrayBindingPattern(nameNode)) {
      return 'ArrayBinding';
    }
    if (Node.isComputedPropertyName(nameNode)) {
      return 'Computed';
    }
    return `Numeric${nameNode.getLiteralText()}`;
  };
}

export default InterfaceHandler;
