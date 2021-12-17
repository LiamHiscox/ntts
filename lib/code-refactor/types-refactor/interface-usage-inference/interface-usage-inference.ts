import {
  InterfaceDeclaration,
  Project,
  PropertyAssignment,
  PropertyDeclaration,
  PropertySignature,
  ShorthandPropertyAssignment,
  Type,
  Node,
  VariableDeclaration,
  ReferenceFindableNode,
  ParameterDeclaration
} from "ts-morph";
import {findReferences} from "../../helpers/reference-finder/reference-finder";
import {InterfaceReadReferenceChecker} from "./interface-read-reference-checker/interface-read-reference-checker";
import {WriteAccessTypeInference} from "../write-access-type-inference/write-access-type-inference";
import {BindingNameHandler} from "../helpers/binding-name-handler/binding-name-handler";

export type PropertyUsageTypes =  ParameterDeclaration | VariableDeclaration | PropertyDeclaration | PropertyAssignment | ShorthandPropertyAssignment | PropertySignature;

export class InterfaceUsageInference {
  static checkPropertyWriteAccess = (interfaceDeclaration: InterfaceDeclaration, project: Project) => {
    interfaceDeclaration.getProperties().forEach(property =>
      WriteAccessTypeInference.inferTypeByWriteAccess(property, project))
  }

  static addPropertiesByUsage = (declaration: PropertyUsageTypes, interfaces: InterfaceDeclaration[]) => {
    const nameNode = declaration.getNameNode();
    if (Node.isArrayBindingPattern(nameNode) || Node.isObjectBindingPattern(nameNode))
      BindingNameHandler.getIdentifiers(nameNode).forEach(identifier => this.checkType(identifier.getType(), identifier, interfaces));
    else
      this.checkType(declaration.getType(), declaration, interfaces);
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

  private static checkDeclarationReferences = (declaration: ReferenceFindableNode & Node, interfaceDeclarations: InterfaceDeclaration[], array: boolean) => {
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
