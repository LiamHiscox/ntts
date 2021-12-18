import {
  BindingName,
  InterfaceDeclaration,
  Node,
  ParameterDeclaration,
  Project,
  PropertyDeclaration,
  PropertyName,
  SyntaxKind,
  TypeLiteralNode,
  TypeNode,
  VariableDeclaration
} from "ts-morph";
import {createInterface, getInterfaces} from "./interface-creator/interface-creator";
import {TypeHandler} from "../type-handler/type-handler";
import {TypeSimplifier} from "../helpers/type-simplifier/type-simplifier";

export class InterfaceHandler {
  static createInterfaceFromObjectLiterals = (declaration: VariableDeclaration | ParameterDeclaration | PropertyDeclaration, project: Project) => {
    const initialTypeNode = declaration.getTypeNode();
    const typeNode = initialTypeNode || TypeHandler.getTypeNode(declaration);
    const nameNode = declaration.getNameNode();
    const typeLiteral = this.getFirstTypeLiteral(typeNode);

    if (typeLiteral) {
      const parent = typeLiteral.getParent();
      if (Node.isUnionTypeNode(parent)) {
        const interfaces = getInterfaces(project);
        const nonTypeLiterals = parent.getTypeNodes().filter(node =>
          !Node.isTypeLiteral(node) && (!Node.isImportTypeNode(node) || !interfaces.find(i => i.getType().getText() === node.getText())))
        const interfaceDeclarations = parent.getTypeNodes().reduce((acc, node) => {
          if (Node.isImportTypeNode(node)) {
            const declaration = interfaces.find(i => i.getType().getText() === node.getText());
            return declaration ? acc.concat(declaration) : acc;
          }
          return acc;
        }, new Array<InterfaceDeclaration>());
        const typeLiteralNodes = parent.getTypeNodes().reduce((acc, node) => Node.isTypeLiteral(node) ? acc.concat(node) : acc, new Array<TypeLiteralNode>());
        if (interfaceDeclarations.length <= 0) {
          const interfaceName = this.getInterfaceName(nameNode);
          const [first, ...literals] = typeLiteralNodes;
          const interfaceDeclaration = createInterface(interfaceName, project, first.getMembers());
          this.addPropertiesToInterface(interfaceDeclaration, literals, nonTypeLiterals, parent, declaration, project);
        } else {
          interfaceDeclarations.forEach(interfaceDeclaration => {
            this.addPropertiesToInterface(interfaceDeclaration, typeLiteralNodes, nonTypeLiterals, parent, declaration, project);
          })
        }
      } else {
        const interfaceName = this.getInterfaceName(nameNode);
        const interfaceDeclaration = createInterface(interfaceName, project, typeLiteral.getMembers());
        typeLiteral.replaceWithText(interfaceDeclaration.getType().getText());
        TypeHandler.setType(declaration, TypeHandler.getType(declaration));
        this.createInterfaceFromObjectLiterals(declaration, project);
      }
    } else if (!initialTypeNode) {
      declaration.removeType();
    }
  }

  private static getFirstTypeLiteral = (typeNode: TypeNode): TypeLiteralNode | undefined => {
    if (Node.isTypeLiteral(typeNode))
      return typeNode;
    return typeNode.getFirstDescendantByKind(SyntaxKind.TypeLiteral);
  }

  private static addPropertiesToInterface = (interfaceDeclaration: InterfaceDeclaration,
                                             typeLiterals: TypeLiteralNode[],
                                             nonTypeLiterals: TypeNode[],
                                             typeNode: TypeNode,
                                             declaration: VariableDeclaration | ParameterDeclaration | PropertyDeclaration,
                                             project: Project
  ) => {
    const combined = typeLiterals.reduce((combined: InterfaceDeclaration, literal) => TypeSimplifier.combineTypeLiterals(combined, literal), interfaceDeclaration);
    const simplifiedType = nonTypeLiterals.map(c => c.getText()).concat(combined.getType().getText()).join(' | ');
    typeNode.replaceWithText(simplifiedType);
    TypeHandler.setType(declaration, TypeHandler.getType(declaration));
    this.createInterfaceFromObjectLiterals(declaration, project);
  }

  private static getInterfaceName = (nameNode: BindingName | PropertyName) => {
    if (Node.isIdentifier(nameNode) || Node.isPrivateIdentifier(nameNode) || Node.isStringLiteral(nameNode))
      return nameNode.getText();
    if (Node.isObjectBindingPattern(nameNode))
      return "ObjectBinding";
    if (Node.isArrayBindingPattern(nameNode))
      return "ArrayBinding";
    if (Node.isComputedPropertyName(nameNode))
      return "Computed";
    return "Numeric" + nameNode.getLiteralText();
  }
}
