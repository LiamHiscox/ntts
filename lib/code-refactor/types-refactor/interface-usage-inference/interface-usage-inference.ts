import {
  ElementAccessExpression,
  Identifier,
  InterfaceDeclaration,
  Node,
  Project,
  ReferenceFindableNode,
  SyntaxKind,
  Type,
  TypeLiteralNode,
  TypeNode,
} from 'ts-morph';
import { findReferences } from '../../helpers/reference-finder/reference-finder';
import InterfaceReadReferenceChecker from './interface-read-reference-checker/interface-read-reference-checker';
import WriteAccessTypeInference from '../write-access-type-inference/write-access-type-inference';
import TypeHandler from '../type-handler/type-handler';
import { TypeMemberKind } from '../../helpers/combined-types/combined-types';

class InterfaceUsageInference {
  static checkProperties = (interfaceDeclaration: TypeMemberKind, project: Project, target: string) => {
    interfaceDeclaration.getProperties().forEach((property) => {
      WriteAccessTypeInference.inferTypeByWriteAccess(property, project, target);
      this.checkTypeNode(TypeHandler.getTypeNode(property), property);
    });
  };

  static addPropertiesByUsage = (node: ElementAccessExpression | Identifier, interfaces: InterfaceDeclaration[]) => {
    const type = TypeHandler.getType(node);
    if (type.isInterface()) {
      this.checkInterfaceType(type, node, interfaces);
    } else if (type.isUnion()) {
      this.checkUnionType(type, node, interfaces);
    }
  };

  private static getFirstTypeLiteral = (typeNode: TypeNode): TypeLiteralNode | undefined => {
    if (Node.isTypeLiteral(typeNode)) {
      return typeNode;
    }
    return typeNode.getFirstDescendantByKind(SyntaxKind.TypeLiteral);
  };

  private static  getValidImportTypes = (typeNode: TypeNode): TypeLiteralNode[] => {
    const typeLiteral = this.getFirstTypeLiteral(typeNode);
    if (typeLiteral) {
      const parent = typeLiteral.getParent();
      if (Node.isUnionTypeNode(parent)) {
        return parent.getTypeNodes().reduce((acc: TypeLiteralNode[], node) => (Node.isTypeLiteral(node) ? acc.concat(node) : acc), []);
      }
      return [typeLiteral];
    }
    return [];
  };

  private static checkTypeNode = (typeNode: TypeNode, declaration: ReferenceFindableNode & Node) => {
    const validTypeNodes = this.getValidImportTypes(typeNode);
    if (validTypeNodes.length > 0) {
      this.checkDeclarationReferences(declaration, validTypeNodes);
    }
  };

  private static checkInterfaceType = (type: Type, node: Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceDeclarations = interfaces.filter((i) => TypeHandler.getType(i).getText() === type.getText());
    if (interfaceDeclarations.length > 0) {
      InterfaceReadReferenceChecker.addNewProperty(node, interfaceDeclarations);
    }
  };

  private static checkUnionType = (type: Type, node: Node, interfaces: InterfaceDeclaration[]) => {
    const interfaceTypes = type.getUnionTypes().filter((u) => u.isInterface());
    const interfaceDeclarations = interfaces.filter((i) => interfaceTypes.find((t) => t.getText() === TypeHandler.getType(i).getText()));
    if (interfaceDeclarations.length > 0) {
      InterfaceReadReferenceChecker.addNewProperty(node, interfaceDeclarations);
    }
  };

  private static checkDeclarationReferences = (declaration: ReferenceFindableNode & Node, interfaceDeclarations: TypeMemberKind[]) => {
    findReferences(declaration).forEach((symbol) => symbol.getReferences().forEach((entry) => {
      if (!entry.isWriteAccess() && !entry.isDefinition()) {
        InterfaceReadReferenceChecker.addNewProperty(entry.getNode(), interfaceDeclarations);
      }
    }));
  };
}

export default InterfaceUsageInference;
