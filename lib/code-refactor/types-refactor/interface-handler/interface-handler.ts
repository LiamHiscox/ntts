import {
  Project,
  Node,
  PropertyDeclaration,
  VariableDeclaration,
  BindingName,
  PropertyName,
  TypeLiteralNode,
  ImportTypeNode,
  InterfaceDeclaration,
  TypeNode,
  SyntaxKind,
  Identifier
} from "ts-morph";
import {createInterface, getInterface, getSourceFile} from "./interface-creator/interface-creator";
import {TypeHandler} from "../type-handler/type-handler";
import {ObjectLiteralHandler} from "../helpers/object-literal-handler/object-literal-handler";
import {ImportTypeParser} from "../helpers/import-type-parser/import-type-parser";

export class InterfaceHandler {
  static createInterfaceFromObjectLiterals = (declaration: PropertyDeclaration | VariableDeclaration, project: Project) => {
    const nameNode = declaration.getNameNode();
    const initialTypeNode = declaration.getTypeNode();
    const typeNode = initialTypeNode || TypeHandler.getTypeNode(declaration);
    const fullPath = getSourceFile(project).getFilePath();

    if (Node.isTypeLiteral(typeNode)) {
      const interfaceName = this.getInterfaceName(nameNode);
      const interfaceDeclaration = createInterface(interfaceName, project, typeNode.getMembers());
      TypeHandler.setType(declaration, interfaceDeclaration.getType());
    } else if (Node.isUnionTypeNode(typeNode) && typeNode.getTypeNodes().find(t => Node.isTypeLiteral(t))) {
      const typeNodes = typeNode.getTypeNodes();
      const nonTypeLiterals = typeNodes.filter(node => !Node.isTypeLiteral(node) && !this.isImportOfGeneratedInterface(node, fullPath));
      const typeLiterals = typeNodes.reduce((acc, node) => Node.isTypeLiteral(node) ? acc.concat(node) : acc, new Array<TypeLiteralNode>());
      const importTypes = typeNodes.reduce((acc, node) => this.isImportOfGeneratedInterface(node, fullPath) ? acc.concat(node) : acc, new Array<ImportTypeNode>());
      if (importTypes.length <= 0) {
        const interfaceName = this.getInterfaceName(nameNode);
        const [first, ...literals] = typeLiterals;
        const interfaceDeclaration = createInterface(interfaceName, project, first.getMembers());
        this.addPropertiesToInterface(interfaceDeclaration, literals, nonTypeLiterals, declaration);
      } else {
        const identifiers = importTypes.reduce((acc, importType) => {
          const qualifier = importType.getQualifier();
          return qualifier ? acc.concat(ImportTypeParser.getFirstIdentifier(qualifier)) : acc;
        }, new Array<Identifier>())
        identifiers.forEach(identifier => {
          const interfaceDeclaration = getInterface(identifier.getText(), project);
          this.addPropertiesToInterface(interfaceDeclaration, typeLiterals, nonTypeLiterals, declaration);
        })
      }
    } else if (!initialTypeNode) {
      declaration.removeType();
    }
  }

  private static addPropertiesToInterface = (interfaceDeclaration: InterfaceDeclaration,
                                             typeLiterals: TypeLiteralNode[],
                                             nonTypeLiterals: TypeNode[],
                                             declaration: PropertyDeclaration | VariableDeclaration
  ) => {
    if (typeLiterals.length > 0) {
      const combined = typeLiterals.reduce((combined: InterfaceDeclaration, literal) => ObjectLiteralHandler.combineTypeLiterals(combined, literal), interfaceDeclaration);
      const simplifiedType = nonTypeLiterals.map(c => c.getText()).concat(combined.getType().getText()).join(' | ');
      TypeHandler.setTypeFiltered(declaration, simplifiedType);
    }
  }

  private static isImportOfGeneratedInterface = (typeNode: TypeNode, generatedPath: string): typeNode is ImportTypeNode => {
    const fullModuleSpecifier = typeNode
      .asKind(SyntaxKind.ImportType)
      ?.getArgument()
      .asKind(SyntaxKind.LiteralType)
      ?.getLiteral()
      .asKind(SyntaxKind.StringLiteral)
      ?.getLiteralValue();
    return `${fullModuleSpecifier}.ts` === generatedPath;
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
