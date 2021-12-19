import {
  ImportTypeNode,
  InterfaceDeclaration,
  Node,
  Project,
  ReferenceFindableNode,
  Type,
  TypeLiteralNode,
  TypeNode,
} from "ts-morph";
import {findReferences} from "../../helpers/reference-finder/reference-finder";
import {InterfaceReadReferenceChecker} from "./interface-read-reference-checker/interface-read-reference-checker";
import {WriteAccessTypeInference} from "../write-access-type-inference/write-access-type-inference";
import {TypeHandler} from "../type-handler/type-handler";

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

  static addPropertiesByUsage = (node: Node | undefined, interfaces: InterfaceDeclaration[]) => {
    const type = node?.getType();
    if (node && type?.isInterface())
      this.checkInterfaceType(type, node, interfaces);
    else if (node && type?.isUnion())
      this.checkUnionType(type, node, interfaces);
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

  private static checkInterfaceType = (type: Type, node: Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceDeclarations = interfaces.filter(i => i.getType().getText() === type.getText());
    if (interfaceDeclarations.length > 0)
      InterfaceReadReferenceChecker.getType(node, interfaceDeclarations);
  }

  private static checkUnionType = (type: Type, node: Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceTypes = type.getUnionTypes().filter(u => u.isInterface());
    const interfaceDeclarations = interfaces.filter(i => interfaceTypes.find(t => t.getText() === i.getType().getText()));
    if (interfaceDeclarations.length > 0)
      InterfaceReadReferenceChecker.getType(node, interfaceDeclarations);
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
