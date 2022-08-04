import {
  ArrowFunction,
  BindingName,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  IndexSignatureDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  Node,
  ParameterDeclaration,
  Project,
  PropertyDeclaration,
  PropertyName,
  PropertySignature,
  TypeLiteralNode,
  UnionTypeNode,
  VariableDeclaration
} from 'ts-morph';
import { createInterface, getInterfaceName, getInterfaces } from './interface-creator/interface-creator';
import TypeHandler from '../type-handler/type-handler';
import TypeSimplifier from '../helpers/type-simplifier/type-simplifier';
import InterfaceFinder from './interface-finder/interface-finder';

type DeclarationKind = VariableDeclaration | ParameterDeclaration | PropertyDeclaration | PropertySignature;
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
      this.checkTypeLiteral(typeLiteral, nameNode, project, target);
      TypeHandler.setType(declaration, TypeHandler.getType(declaration));
      this.createInterfaceFromObjectLiterals(declaration, project, target);
    } else if (!initialTypeNode) {
      declaration.removeType();
    }
  };

  static createInterfaceFromObjectLiteralsReturn = (declaration: IndexSignatureDeclaration, project: Project, target: string) => {
    const typeNode = TypeHandler.getReturnTypeNode(declaration);
    const nameNode = declaration.getKeyNameNode();
    const typeLiteral = InterfaceFinder.getFirstTypeLiteral(typeNode);
    if (typeLiteral) {
      this.checkTypeLiteral(typeLiteral, nameNode, project, target);
      TypeHandler.setReturnTypeFiltered(declaration, declaration.getReturnType().getText());
      this.createInterfaceFromObjectLiteralsReturn(declaration, project, target);
    }
  };

  static createInterfaceFromObjectLiteralsFunctionReturn = (
    declaration: FunctionDeclaration | ArrowFunction | MethodDeclaration | FunctionExpression | GetAccessorDeclaration,
    project: Project,
    target: string
  ) => {
    const typeNode = TypeHandler.getReturnTypeNode(declaration);
    const nameNode = this.getNameNode(declaration);
    const typeLiteral = InterfaceFinder.getFirstTypeLiteral(typeNode);
    if (typeLiteral) {
      this.checkTypeLiteral(typeLiteral, nameNode, project, target);
      TypeHandler.setReturnTypeFiltered(declaration, declaration.getReturnType().getText());
      this.createInterfaceFromObjectLiteralsFunctionReturn(declaration, project, target);
    }
  };

  static validateDeclaration = (declaration: DeclarationKind) => {
    const initializer = declaration.getInitializer();
    return !initializer || (!Node.isArrowFunction(initializer) && !Node.isFunctionExpression(initializer));
  }

  private static getNameNode = (
    declaration: FunctionDeclaration | ArrowFunction | MethodDeclaration | FunctionExpression | GetAccessorDeclaration
  ) => {
    if (
      Node.isFunctionDeclaration(declaration)
      || Node.isMethodDeclaration(declaration)
      || Node.isGetAccessorDeclaration(declaration)
    ) {
      return declaration.getNameNode();
    }
    const parent = declaration.getParent();
    if (
      Node.isVariableDeclaration(parent)
      || Node.isParameterDeclaration(parent)
      || Node.isPropertyDeclaration(parent)
      || Node.isPropertySignature(parent)
    ) {
      return parent.getNameNode();
    }
    return undefined;
  }

  private static checkTypeLiteral = (
    typeLiteral: TypeLiteralNode,
    nameNode: NameNodeKind | undefined,
    project: Project,
    target: string
  ) => {
    const parent = typeLiteral.getParent();
    if (Node.isUnionTypeNode(parent)) {
      const simplifiedType = this.checkUnionTypeNode(parent, nameNode, project, target);
      parent.replaceWithText(simplifiedType);
    } else {
      const interfaceName = getInterfaceName(nameNode);
      const interfaceDeclaration = createInterface(interfaceName, project, target, typeLiteral.getMembers());
      typeLiteral.replaceWithText(TypeHandler.getType(interfaceDeclaration).getText());
    }
  };

  private static checkUnionTypeNode = (
    unionTypeNode: UnionTypeNode,
    nameNode: NameNodeKind | undefined,
    project: Project,
    target: string
  ) => {
    const interfaces = getInterfaces(project, target);
    const typeNodes = unionTypeNode.getTypeNodes();
    const nonTypeLiterals = InterfaceFinder.getNonTypeLiteralNodes(typeNodes, interfaces);
    const interfaceDeclarations = InterfaceFinder.getInterfaceDeclarations(typeNodes, interfaces);
    const typeLiteralNodes = InterfaceFinder.getTypeLiteralNodes(typeNodes);
    if (interfaceDeclarations.length <= 0) {
      const interfaceName = getInterfaceName(nameNode);
      const [first, ...literals] = typeLiteralNodes;
      const interfaceDeclaration = createInterface(interfaceName, project, target, first.getMembers());
      this.addPropertiesToInterface(interfaceDeclaration, literals, project, target);
      return nonTypeLiterals
        .map((c) => c.getText())
        .concat(TypeHandler.getType(interfaceDeclaration).getText())
        .join(' | ');
    } else {
      interfaceDeclarations.forEach((i) => this.addPropertiesToInterface(i, typeLiteralNodes, project, target));
      return nonTypeLiterals
        .map((c) => c.getText())
        .concat(interfaceDeclarations.map(i => TypeHandler.getType(i).getText()))
        .join(' | ');
    }
  };

  private static addPropertiesToInterface = (
    interfaceDeclaration: InterfaceDeclaration,
    typeLiterals: TypeLiteralNode[],
    project: Project,
    target: string
  ) => {
    const newInterface = typeLiterals
      .reduce((c: InterfaceDeclaration, literal) => TypeSimplifier.combineTypeLiterals(c, literal), interfaceDeclaration);
    newInterface.getMembers().forEach(member => {
      if (Node.isPropertySignature(member)) {
        this.createInterfaceFromObjectLiterals(member, project, target);
      }
      if (Node.isIndexSignatureDeclaration(member)) {
        this.createInterfaceFromObjectLiteralsReturn(member, project, target);
      }
    });
  };
}

export default InterfaceHandler;
