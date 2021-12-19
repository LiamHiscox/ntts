import {
  InterfaceDeclaration,
  Node,
  Project,
  ReferenceFindableNode,
  SyntaxKind,
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
      this.checkTypeNode(TypeHandler.getTypeNode(property), property);
      const typeNode = TypeHandler.getTypeNode(property);
      const elementTypeNode = Node.isArrayTypeNode(typeNode) ? typeNode.getElementTypeNode() : typeNode;
      this
        .getValidTypeNodes(elementTypeNode)
        .forEach(validTypeNode => this.checkProperties(validTypeNode, interfaces, project))
    })
  }

  static addPropertiesByUsage = (node: Node | undefined, interfaces: InterfaceDeclaration[]) => {
    const type = node && TypeHandler.getType(node);
    if (node && type?.isInterface())
      this.checkInterfaceType(type, node, interfaces);
    else if (node && type?.isUnion())
      this.checkUnionType(type, node, interfaces);
  }

  private static getFirstTypeLiteral = (typeNode: TypeNode): TypeLiteralNode | undefined => {
    if (Node.isTypeLiteral(typeNode))
      return typeNode;
    return typeNode.getFirstDescendantByKind(SyntaxKind.TypeLiteral);
  }

  private static getValidTypeNodes = (typeNode: TypeNode): TypeLiteralNode[] => {
    const typeLiteral = this.getFirstTypeLiteral(typeNode);
    if (typeLiteral) {
      const parent = typeLiteral.getParent();
      if (Node.isUnionTypeNode(parent))
        return parent.getTypeNodes().reduce((acc: TypeLiteralNode[], node) =>
          Node.isTypeLiteral(node) ? acc.concat(node) : acc, new Array<TypeLiteralNode>());
      return [typeLiteral];
    }
    return [];
  }

  private static checkTypeNode = (typeNode: TypeNode, declaration: ReferenceFindableNode & Node) => {
    const validTypeNodes = this.getValidTypeNodes(typeNode);
    if (validTypeNodes.length > 0)
      this.checkDeclarationReferences(declaration, validTypeNodes);
  }

  private static checkInterfaceType = (type: Type, node: Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceDeclarations = interfaces.filter(i => TypeHandler.getType(i).getText() === type.getText());
    if (interfaceDeclarations.length > 0)
      InterfaceReadReferenceChecker.getType(node, interfaceDeclarations);
  }

  private static checkUnionType = (type: Type, node: Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceTypes = type.getUnionTypes().filter(u => u.isInterface());
    const interfaceDeclarations = interfaces.filter(i => interfaceTypes.find(t => t.getText() === TypeHandler.getType(i).getText()));
    if (interfaceDeclarations.length > 0)
      InterfaceReadReferenceChecker.getType(node, interfaceDeclarations);
  }

  private static checkDeclarationReferences = (declaration: ReferenceFindableNode & Node, interfaceDeclarations: (InterfaceDeclaration | TypeLiteralNode)[]) => {
    findReferences(declaration).forEach(symbol =>
      symbol.getReferences().forEach(entry => {
        if (!entry.isWriteAccess() && !entry.isDefinition())
          InterfaceReadReferenceChecker.getType(entry.getNode(), interfaceDeclarations);
      }))
  }
}
