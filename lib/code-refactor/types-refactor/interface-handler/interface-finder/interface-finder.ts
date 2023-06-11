import {
  InterfaceDeclaration, Node, SyntaxKind, TypeLiteralNode, TypeNode,
} from 'ts-morph';
import TypeHandler from '../../type-handler/type-handler.js';

class InterfaceFinder {
  static getTypeLiteralNodes = (typeNodes: TypeNode[]): TypeLiteralNode[] => typeNodes
    .reduce((acc: TypeLiteralNode[], node) => (Node.isTypeLiteral(node) ? acc.concat(node) : acc), []);

  static getNonTypeLiteralNodes = (typeNodes: TypeNode[], interfaces: InterfaceDeclaration[]): TypeNode[] => typeNodes
    .filter((node) => !Node.isTypeLiteral(node) && (
      !Node.isImportTypeNode(node)
      || !interfaces.find((i) => TypeHandler.getType(i).getText() === node.getText())
    ));

  static getInterfaceDeclarations = (typeNodes: TypeNode[], interfaces: InterfaceDeclaration[]) => typeNodes
    .reduce((acc: InterfaceDeclaration[], node) => {
      if (Node.isImportTypeNode(node)) {
        const declaration = interfaces.find((i) => TypeHandler.getType(i).getText() === node.getText());
        return declaration ? acc.concat(declaration) : acc;
      }
      return acc;
    }, []);

  static getFirstTypeLiteral = (typeNode: TypeNode): TypeLiteralNode | undefined => {
    if (Node.isTypeLiteral(typeNode)) {
      return typeNode;
    }
    return typeNode.getFirstDescendantByKind(SyntaxKind.TypeLiteral);
  };
}

export default InterfaceFinder;
