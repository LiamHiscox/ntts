import {
  BindingName,
  InterfaceDeclaration,
  Node,
  ParameterDeclaration,
  Project,
  PropertyDeclaration,
  PropertyName,
  PropertySignature,
  SourceFile,
  SyntaxKind,
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

  private static getFirstSignatureAncestor = (node: Node | undefined) => {
    const signature = node?.getAncestors().find(a => Node.isPropertySignature(a) || Node.isIndexSignatureDeclaration(a));
    if (Node.isPropertySignature(signature) || Node.isIndexSignatureDeclaration(signature)) {
      return signature;
    }
    return undefined;
  }

  static createInterfacesFromSourceFile = (sourceFile: SourceFile, project: Project, target: string) => {
    const typeLiteral = sourceFile.getFirstDescendantByKind(SyntaxKind.TypeLiteral);
    const signature = this.getFirstSignatureAncestor(typeLiteral);
    if (typeLiteral && Node.isPropertySignature(signature)) {
      const nameNode = signature.getNameNode();
      this.checkTypeLiteral(typeLiteral, nameNode, project, target);
      TypeHandler.setType(signature, TypeHandler.getType(signature));
      this.createInterfacesFromSourceFile(sourceFile, project, target);
    } else if (typeLiteral && Node.isIndexSignatureDeclaration(signature)) {
      const nameNode = signature.getKeyNameNode();
      this.checkTypeLiteral(typeLiteral, nameNode, project, target);
      signature.setReturnType(signature.getReturnType().getText());
      this.createInterfacesFromSourceFile(sourceFile, project, target);
    }
  }

  static validateDeclaration = (declaration: DeclarationKind) => {
    const initializer = declaration.getInitializer();
    return !initializer || (!Node.isArrowFunction(initializer) && !Node.isFunctionExpression(initializer));
  }

  private static checkTypeLiteral = (
    typeLiteral: TypeLiteralNode,
    nameNode: NameNodeKind,
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
    nameNode: NameNodeKind,
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
      this.addPropertiesToInterface(interfaceDeclaration, literals);
      return nonTypeLiterals
        .map((c) => c.getText())
        .concat(TypeHandler.getType(interfaceDeclaration).getText())
        .join(' | ');
    } else {
      interfaceDeclarations.forEach((i) => this.addPropertiesToInterface(i, typeLiteralNodes));
      return nonTypeLiterals
        .map((c) => c.getText())
        .concat(interfaceDeclarations.map(i => TypeHandler.getType(i).getText()))
        .join(' | ');
    }
  };

  private static addPropertiesToInterface = (
    interfaceDeclaration: InterfaceDeclaration,
    typeLiterals: TypeLiteralNode[]
  ) => {
    typeLiterals.reduce((c: InterfaceDeclaration, literal) => TypeSimplifier.combineTypeLiterals(c, literal), interfaceDeclaration);
  };
}

export default InterfaceHandler;
