import {
  ElementAccessExpression,
  IndexSignatureDeclaration,
  Node,
  NoSubstitutionTemplateLiteral,
  NumericLiteral, Project,
  PropertyAccessExpression,
  PropertyName,
  PropertySignature,
  StringLiteral,
  SyntaxKind, Type,
} from 'ts-morph';
import VariableValidator from '../../../helpers/variable-validator/variable-validator';
import TypeHandler from '../../type-handler/type-handler';
import { isWriteAccess } from '../../../helpers/expression-handler/expression-handler';
import TypeSimplifier from '../../helpers/type-simplifier/type-simplifier';
import { TypeMemberKind } from '../../../helpers/combined-types/combined-types';
import WriteAccessTypeInference from "../../write-access-type-inference/write-access-type-inference";
import InterfaceHandler from "../../interface-handler/interface-handler";

class InterfaceReadReferenceChecker {
  static addNewProperty = (node: Node, interfaceDeclarations: TypeMemberKind[], project: Project, target: string) => {
    const access = this.getPropertyOrElementAccess(node.getParent(), node.getPos());
    if (Node.isPropertyAccessExpression(access)) {
      interfaceDeclarations.forEach((interfaceDeclaration) => {
        this.checkPropertyAccess(access, interfaceDeclaration, project, target);
      });
    }
    if (Node.isElementAccessExpression(access)) {
      interfaceDeclarations.forEach((interfaceDeclaration) => {
        this.checkElementAccess(access, interfaceDeclaration, project, target);
      });
    }
  };

  private static getPropertyOrElementAccess = (
    node: Node | undefined,
    identifierPos: number,
  ): PropertyAccessExpression | ElementAccessExpression | undefined => {
    if ((Node.isElementAccessExpression(node) && node.getArgumentExpression()?.getPos() !== identifierPos)
      || (Node.isPropertyAccessExpression(node) && node.getNameNode().getPos() !== identifierPos)) {
      return node;
    }
    if (Node.isPropertyAccessExpression(node)) {
      return this.getPropertyOrElementAccess(node.getParent(), identifierPos);
    }
    return undefined;
  };

  private static getInterfaceProperty = (propertyAccess: PropertyAccessExpression, interfaceDeclaration: TypeMemberKind): PropertySignature => {
    const property = interfaceDeclaration.getProperty(propertyAccess.getName());
    if (!property) {
      return interfaceDeclaration.addProperty({ hasQuestionToken: true, name: propertyAccess.getName(), type: 'any' });
    }
    return property;
  }

  private static checkPropertyAccess = (propertyAccess: PropertyAccessExpression, interfaceDeclaration: TypeMemberKind, project: Project, target: string) => {
    if (propertyAccess.getNameNode().getSymbol()) {
      return;
    }
    const property = this.getInterfaceProperty(propertyAccess, interfaceDeclaration);
    const nameNode = propertyAccess.getNameNode();
    const type = WriteAccessTypeInference.checkNameNodeWriteAccess(nameNode);
    if (type) {
      const combined = TypeHandler.combineTypeWithList(TypeHandler.getType(nameNode), type);
      const newProperty = TypeHandler.setTypeFiltered(property, combined);
      InterfaceHandler.createInterfaceFromObjectLiterals(newProperty, project, target);
      return newProperty;

    }
    return property;
  };

  private static checkElementAccess = (elementAccess: ElementAccessExpression, interfaceDeclaration: TypeMemberKind, project: Project, target: string) => {
    const node = elementAccess.getArgumentExpression();
    const member = this.parseElementAccess(elementAccess, interfaceDeclaration);
    if (Node.isIndexSignatureDeclaration(member) && node) {
      return this.updateReturnType(member, node, project, target);
    }
    return member;
  };

  private static updateReturnType = (indexSignature: IndexSignatureDeclaration, node: Node, project: Project, target: string): IndexSignatureDeclaration => {
    const type = this.getWriteAccessType(node);
    if (type) {
      const combined = TypeHandler.combineTypes(indexSignature.getReturnType(), type);
      const newIndexSignature = TypeHandler.setReturnTypeFiltered(indexSignature, combined);
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getReturnTypeNode(newIndexSignature));
      const newProperty = TypeHandler.setReturnTypeFiltered(newIndexSignature, stringSimplified);
      InterfaceHandler.createInterfaceFromObjectLiteralsReturn(newProperty, project, target);
      return newProperty;
    }
    return indexSignature;
  };

  private static parseElementAccess = (
    access: ElementAccessExpression,
    interfaceDeclaration: TypeMemberKind,
  ): IndexSignatureDeclaration | PropertySignature | undefined => {
    const argumentExpression = access.getArgumentExpression();
    if (Node.isStringLiteral(argumentExpression)
      || Node.isNoSubstitutionTemplateLiteral(argumentExpression)) {
      return this.parseStringLiteral(argumentExpression, interfaceDeclaration);
    }
    if (Node.isNumericLiteral(argumentExpression)) {
      return this.parseNumericLiteral(argumentExpression, interfaceDeclaration);
    }
    if (Node.isTemplateExpression(argumentExpression)
      || (argumentExpression && TypeHandler.getType(argumentExpression).isString())) {
      return this.parseString(interfaceDeclaration);
    }
    if (argumentExpression && TypeHandler.getType(argumentExpression).isNumber()) {
      return this.parseNumber(interfaceDeclaration);
    }
    if (argumentExpression && TypeHandler.getType(argumentExpression).getText() === 'symbol') {
      return this.parseSymbol(interfaceDeclaration);
    }
    if (interfaceDeclaration.getIndexSignatures().length <= 0) {
      return this.parseString(interfaceDeclaration);
    }
    return undefined;
  };

  private static parseStringLiteral = (literal: StringLiteral | NoSubstitutionTemplateLiteral, interfaceDeclaration: TypeMemberKind) => {
    const value = literal.getLiteralValue();
    const property = this.findProperty(value, interfaceDeclaration);
    if (property) {
      return undefined;
    }
    if (VariableValidator.validVariableName(value)) {
      return interfaceDeclaration.addProperty({ hasQuestionToken: true, name: value, type: 'any' });
    }
    return interfaceDeclaration.addProperty({ hasQuestionToken: true, name: `'${value}'`, type: 'any' });
  };

  private static parseNumericLiteral = (literal: NumericLiteral, interfaceDeclaration: TypeMemberKind) => {
    const value = `${literal.getLiteralValue()}`;
    const property = this.findProperty(value, interfaceDeclaration);
    if (property) {
      return undefined;
    }
    return interfaceDeclaration.addProperty({ hasQuestionToken: true, name: value, type: 'any' });
  };

  private static parseString = (interfaceDeclaration: TypeMemberKind): IndexSignatureDeclaration => {
    const indexSignature = this.findIndexSignature('string', interfaceDeclaration);
    if (indexSignature) {
      return indexSignature;
    }
    const numberIndex = this.findIndexSignature('number', interfaceDeclaration);
    return numberIndex?.setKeyType('string') || interfaceDeclaration.addIndexSignature({
      keyName: 'key',
      keyType: 'string',
      returnType: 'any',
    });
  };

  private static parseNumber = (interfaceDeclaration: TypeMemberKind): IndexSignatureDeclaration => {
    const indexSignature = this.findIndexSignature('number', interfaceDeclaration)
      || this.findIndexSignature('string', interfaceDeclaration);
    return indexSignature || interfaceDeclaration.addIndexSignature({
      keyName: 'key',
      keyType: 'number',
      returnType: 'any',
    });
  };

  private static parseSymbol = (interfaceDeclaration: TypeMemberKind): IndexSignatureDeclaration => {
    const indexSignature = this.findIndexSignature('symbol', interfaceDeclaration);
    return indexSignature || interfaceDeclaration.addIndexSignature({
      keyName: 'key',
      keyType: 'symbol',
      returnType: 'any',
    });
  };

  private static findIndexSignature = (keyType: 'number' | 'string' | 'symbol', interfaceDeclaration: TypeMemberKind) => interfaceDeclaration
    .getIndexSignature((index) => {
      const indexType = index.getKeyType();
      if (indexType.isUnion()) {
        return indexType.getUnionTypes().map((u) => u.getText()).includes(keyType);
      }
      return indexType.getText() === keyType;
    });

  private static getWriteAccessType = (node: Node): Type | undefined => {
    if (isWriteAccess(node)) {
      const right = node.getFirstAncestorByKind(SyntaxKind.BinaryExpression)?.getRight();
      return right ? TypeHandler.getType(right) : undefined;
    }
    return undefined;
  };

  private static findProperty = (literalValue: string,
                                 interfaceDeclaration: TypeMemberKind
  ): PropertySignature | undefined => interfaceDeclaration
    .getProperty((property) => literalValue === this.getLiteralValueOfProperty(property.getNameNode()));

  private static getLiteralValueOfProperty = (nameNode: PropertyName): string => {
    if (Node.isStringLiteral(nameNode) || Node.isNumericLiteral(nameNode)) {
      return `${nameNode.getLiteralValue()}`;
    }
    if (Node.isIdentifier(nameNode) || Node.isPrivateIdentifier(nameNode)) {
      return nameNode.getText();
    }
    return '';
  };
}

export default InterfaceReadReferenceChecker;
