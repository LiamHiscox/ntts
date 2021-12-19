import {
  ElementAccessExpression,
  IndexSignatureDeclaration,
  InterfaceDeclaration,
  Node,
  NoSubstitutionTemplateLiteral,
  NumericLiteral,
  PropertyAccessExpression,
  PropertyName,
  PropertySignature,
  StringLiteral,
  SyntaxKind, Type, TypeLiteralNode
} from "ts-morph";
import {VariableValidator} from "../../../helpers/variable-validator/variable-validator";
import {TypeHandler} from "../../type-handler/type-handler";
import {isWriteAccess} from "../../../helpers/expression-handler/expression-handler";
import {TypeSimplifier} from "../../helpers/type-simplifier/type-simplifier";

export class InterfaceReadReferenceChecker {
  static getType = (node: Node, interfaceDeclarations: (InterfaceDeclaration | TypeLiteralNode)[]) => {
    const access = this.getPropertyOrElementAccess(node.getParent(), node.getPos());
    if (Node.isPropertyAccessExpression(access))
      interfaceDeclarations.forEach(interfaceDeclaration => {
        this.checkPropertyAccess(access, interfaceDeclaration);
      })
    if (Node.isElementAccessExpression(access))
      interfaceDeclarations.forEach(interfaceDeclaration => {
        this.checkElementAccess(access, interfaceDeclaration);
      })
  }

  private static getPropertyOrElementAccess = (node: Node | undefined, identifierPos: number): PropertyAccessExpression | ElementAccessExpression | undefined => {
    if ((Node.isElementAccessExpression(node) && node.getArgumentExpression()?.getPos() !== identifierPos)
      || (Node.isPropertyAccessExpression(node) && node.getNameNode().getPos() !== identifierPos))
      return node;
    if (Node.isPropertyAccessExpression(node))
      return this.getPropertyOrElementAccess(node.getParent(), identifierPos);
    return;
  }

  private static checkPropertyAccess = (propertyAccess: PropertyAccessExpression, interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode) => {
    if (!interfaceDeclaration.getProperty(propertyAccess.getName()) && !propertyAccess.getNameNode().getSymbol())
      return interfaceDeclaration.addProperty({hasQuestionToken: true, name: propertyAccess.getName(), type: "any"});
    return;
  }

  private static checkElementAccess = (elementAccess: ElementAccessExpression, interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode) => {
    const node = elementAccess.getArgumentExpression();
    const member = this.parseElementAccess(elementAccess, interfaceDeclaration);
    if (Node.isIndexSignatureDeclaration(member) && node)
      return this.updateReturnType(member, node);
    return member;
  }

  private static updateReturnType = (indexSignature: IndexSignatureDeclaration, node: Node): IndexSignatureDeclaration => {
    const type = this.getWriteAccessType(node);
    if (type) {
      const combined = TypeHandler.combineTypes(indexSignature.getReturnType(), type);
      const newIndexSignature = TypeHandler.setReturnTypeFiltered(indexSignature, combined);
      const stringSimplified = TypeSimplifier.simplifyTypeNode(TypeHandler.getReturnTypeNode(newIndexSignature));
      return stringSimplified ? TypeHandler.setReturnTypeFiltered(newIndexSignature, stringSimplified) : newIndexSignature;
    }
    return indexSignature;
  }

  private static parseElementAccess = (access: ElementAccessExpression, interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): IndexSignatureDeclaration | PropertySignature | undefined => {
    const argumentExpression = access.getArgumentExpression();
    if (Node.isStringLiteral(argumentExpression)
      || Node.isNoSubstitutionTemplateLiteral(argumentExpression))
      return this.parseStringLiteral(argumentExpression, interfaceDeclaration);
    if (Node.isNumericLiteral(argumentExpression))
      return this.parseNumericLiteral(argumentExpression, interfaceDeclaration);
    if (Node.isTemplateExpression(argumentExpression)
      || (argumentExpression && TypeHandler.getType(argumentExpression).isString()))
      return this.parseString(interfaceDeclaration);
    if (argumentExpression && TypeHandler.getType(argumentExpression).isNumber())
      return this.parseNumber(interfaceDeclaration);
    if (argumentExpression && TypeHandler.getType(argumentExpression).getText() === "symbol")
      return this.parseSymbol(interfaceDeclaration);
    if (interfaceDeclaration.getIndexSignatures().length <= 0)
      return this.parseString(interfaceDeclaration);
    return;
  }

  private static parseStringLiteral = (literal: StringLiteral | NoSubstitutionTemplateLiteral, interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): PropertySignature | undefined => {
    const value = literal.getLiteralValue();
    const property = this.findProperty(value, interfaceDeclaration);
    if (property)
      return;
    if (VariableValidator.validVariableName(value))
      return interfaceDeclaration.addProperty({hasQuestionToken: true, name: value, type: "any"});
    return interfaceDeclaration.addProperty({hasQuestionToken: true, name: `'${value}'`, type: "any"});
  }

  private static parseNumericLiteral = (literal: NumericLiteral, interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): PropertySignature | undefined => {
    const value = '' + literal.getLiteralValue();
    const property = this.findProperty(value, interfaceDeclaration);
    if (property)
      return;
    return interfaceDeclaration.addProperty({hasQuestionToken: true, name: value, type: "any"});
  }

  private static parseString = (interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): IndexSignatureDeclaration => {
    const indexSignature = this.findIndexSignature("string", interfaceDeclaration);
    if (indexSignature)
      return indexSignature;
    const numberIndex = this.findIndexSignature("number", interfaceDeclaration);
    return numberIndex?.setKeyType("string") || interfaceDeclaration.addIndexSignature({
      keyName: "key",
      keyType: "string",
      returnType: "any"
    });
  }

  private static parseNumber = (interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): IndexSignatureDeclaration => {
    const indexSignature = this.findIndexSignature("number", interfaceDeclaration) || this.findIndexSignature("string", interfaceDeclaration);
    return indexSignature || interfaceDeclaration.addIndexSignature({
      keyName: "key",
      keyType: "number",
      returnType: "any"
    });
  }

  private static parseSymbol = (interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): IndexSignatureDeclaration => {
    const indexSignature = this.findIndexSignature("symbol", interfaceDeclaration);
    return indexSignature || interfaceDeclaration.addIndexSignature({
      keyName: "key",
      keyType: "symbol",
      returnType: "any"
    });
  }

  private static findIndexSignature = (keyType: "number" | "string" | "symbol", interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): IndexSignatureDeclaration | undefined => {
    return interfaceDeclaration.getIndexSignature((index) => {
      const indexType = index.getKeyType();
      if (indexType.isUnion())
        return indexType.getUnionTypes().map(u => u.getText()).includes(keyType);
      return indexType.getText() === keyType;
    });
  }

  private static getWriteAccessType = (node: Node): Type | undefined => {
    if (isWriteAccess(node)) {
      const right = node.getFirstAncestorByKind(SyntaxKind.BinaryExpression)?.getRight();
      return right ? TypeHandler.getType(right) : undefined;
    }
    return;
  }

  private static findProperty = (literalValue: string, interfaceDeclaration: InterfaceDeclaration | TypeLiteralNode): PropertySignature | undefined => {
    return interfaceDeclaration.getProperty((property) =>
      literalValue === this.getLiteralValueOfProperty(property.getNameNode()));
  }

  private static getLiteralValueOfProperty = (nameNode: PropertyName): string => {
    if (Node.isStringLiteral(nameNode) || Node.isNumericLiteral(nameNode))
      return '' + nameNode.getLiteralValue();
    if (Node.isIdentifier(nameNode) || Node.isPrivateIdentifier(nameNode))
      return nameNode.getText();
    return '';
  }
}
