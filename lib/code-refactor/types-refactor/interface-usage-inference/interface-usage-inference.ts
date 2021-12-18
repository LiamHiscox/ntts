import {
  ImportTypeNode,
  InterfaceDeclaration,
  Node,
  ParameterDeclaration,
  Project,
  PropertyAssignment,
  PropertyDeclaration,
  PropertySignature,
  ReferenceFindableNode,
  ShorthandPropertyAssignment,
  Type,
  TypeLiteralNode,
  TypeNode,
  VariableDeclaration
} from "ts-morph";
import {findReferences} from "../../helpers/reference-finder/reference-finder";
import {InterfaceReadReferenceChecker} from "./interface-read-reference-checker/interface-read-reference-checker";
import {WriteAccessTypeInference} from "../write-access-type-inference/write-access-type-inference";
import {BindingNameHandler} from "../helpers/binding-name-handler/binding-name-handler";
import {TypeHandler} from "../type-handler/type-handler";

export type PropertyUsageTypes =
  ParameterDeclaration
  | VariableDeclaration
  | PropertyDeclaration
  | PropertyAssignment
  | ShorthandPropertyAssignment
  | PropertySignature;

export class InterfaceUsageInference {
  static checkProperties = (interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode, interfaces: InterfaceDeclaration[], project: Project) => {
    interfaceDeclaration.getProperties().forEach(property => {
      WriteAccessTypeInference.inferTypeByWriteAccess(property, project);
      this.checkTypeNode(TypeHandler.getTypeNode(property), property, interfaces);
      const typeNode = TypeHandler.getTypeNode(property);
      const elementTypeNode = Node.isArrayTypeNode(typeNode) ? typeNode.getElementTypeNode() : typeNode;
      this.getValidTypeNodes(elementTypeNode, interfaces).forEach(validTypeNode => {
        this.checkProperties(validTypeNode, interfaces, project);
      })
    })
  }

  static addPropertiesByUsage = (declaration: PropertyUsageTypes, interfaces: InterfaceDeclaration[]) => {
    const nameNode = declaration.getNameNode();
    if (Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode))
      BindingNameHandler.getIdentifiers(nameNode).forEach(identifier => this.checkType(identifier.getType(), identifier, interfaces));
    else
      this.checkType(declaration.getType(), declaration, interfaces);
  }

  private static getValidTypeNodes = (typeNode: TypeNode, interfaces: InterfaceDeclaration[]): (InterfaceDeclaration | TypeLiteralNode)[] => {
    if (Node.isTypeLiteral(typeNode))
      return [typeNode];
    else if (Node.isImportTypeNode(typeNode) && typeNode.getType().isInterface())
      return interfaces.filter(i => i.getType().getText() === typeNode.getText());
    else if (Node.isUnionTypeNode(typeNode)) {
      const interfaceTypes = typeNode.getTypeNodes().reduce((acc, u) => Node.isImportTypeNode(u) && u.getType().isInterface() ? acc.concat(u) : acc, new Array<ImportTypeNode>());
      const interfaceDeclarations = interfaces.filter(i => interfaceTypes.find(t => t.getText() === i.getType().getText()));
      return typeNode.getTypeNodes().reduce((acc: (InterfaceDeclaration | TypeLiteralNode)[], u) => Node.isTypeLiteral(u) ? acc.concat(u) : acc, interfaceDeclarations);
    }
    return [];
  }

  private static checkTypeNode = (typeNode: TypeNode, declaration: ReferenceFindableNode & Node, interfaces: InterfaceDeclaration[]) => {
    const validTypeNodes = this.getValidTypeNodes(typeNode, interfaces);
    if (validTypeNodes.length > 0)
      this.checkDeclarationReferences(declaration, validTypeNodes, false);
    else if (Node.isArrayTypeNode(typeNode)) {
      const elementTypeNode = typeNode.getElementTypeNode();
      const validTypeNodes = this.getValidTypeNodes(elementTypeNode, interfaces);
      if (validTypeNodes.length > 0)
        this.checkDeclarationReferences(declaration, validTypeNodes, true);
    }
  }

  private static checkType = (type: Type, declaration: ReferenceFindableNode & Node, interfaces: InterfaceDeclaration[]) => {
    if (type.isInterface())
      this.checkInterfaceType(type, declaration, interfaces);
    else if (type.isUnion())
      this.checkUnionType(type, declaration, interfaces);
    else if (type.isArray() && type.getArrayElementType()?.isInterface())
      this.checkInterfaceArrayType(type, declaration, interfaces);
    else if (type.isArray() && type.getArrayElementType()?.isUnion())
      this.checkArrayUnionType(type, declaration, interfaces);
  }

  private static checkInterfaceType = (type: Type, declaration: ReferenceFindableNode & Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceDeclarations = interfaces.filter(i => i.getType().getText() === type.getText());
    if (interfaceDeclarations.length > 0)
      this.checkDeclarationReferences(declaration, interfaceDeclarations, false);
  }

  private static checkUnionType = (type: Type, declaration: ReferenceFindableNode & Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceTypes = type.getUnionTypes().filter(u => u.isInterface());
    const interfaceDeclarations = interfaces.filter(i => interfaceTypes.find(t => t.getText() === i.getType().getText()));
    if (interfaceDeclarations.length > 0)
      this.checkDeclarationReferences(declaration, interfaceDeclarations, false);
  }

  private static checkInterfaceArrayType = (type: Type, declaration: ReferenceFindableNode & Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceDeclarations = interfaces.filter(i => i.getType().getText() === type.getArrayElementTypeOrThrow().getText());
    if (interfaceDeclarations.length > 0)
      this.checkDeclarationReferences(declaration, interfaceDeclarations, true);
  }

  private static checkArrayUnionType = (type: Type, declaration: ReferenceFindableNode & Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceTypes = type.getArrayElementTypeOrThrow().getUnionTypes().filter(u => u.isInterface());
    const interfaceDeclarations = interfaces.filter(i => interfaceTypes.find(t => t.getText() === i.getType().getText()));
    if (interfaceDeclarations.length > 0)
      this.checkDeclarationReferences(declaration, interfaceDeclarations, true);
  }

  private static checkDeclarationReferences = (declaration: ReferenceFindableNode & Node, interfaceDeclarations: (InterfaceDeclaration | TypeLiteralNode)[], array: boolean) => {
    findReferences(declaration).forEach(symbol =>
      symbol.getReferences().forEach(entry => {
        const node = entry.getNode();
        if (array && !entry.isWriteAccess() && !entry.isDefinition())
          InterfaceReadReferenceChecker.getArrayType(node, interfaceDeclarations);
        if (!array && !entry.isWriteAccess() && !entry.isDefinition())
          InterfaceReadReferenceChecker.getType(node, interfaceDeclarations);
      }))
  }
}
