import {
  ElementAccessExpression,
  Node,
  NoSubstitutionTemplateLiteral,
  NumericLiteral,
  PropertyAccessExpression,
  StringLiteral,
  Type
} from "ts-morph";
import {VariableValidator} from "../../../../helpers/variable-validator/variable-validator";

export class ReadReferenceChecker {
  static getType = (node: Node, initialType: Type): string | undefined => {
    const access = this.getPropertyOrElementAccess(node.getParent(), node.getPos());
    if (Node.isPropertyAccessExpression(access) && !initialType.getProperty(access.getName()) && this.isNotDefined(access.getNameNode()))
      return `{ ${access.getName()}: any; }`;
    if (Node.isElementAccessExpression(access))
      return this.parseElementAccess(access, initialType);
    return;
  }

  private static getPropertyOrElementAccess = (node: Node | undefined, identifierPos: number): PropertyAccessExpression | ElementAccessExpression | undefined => {
    if (Node.isElementAccessExpression(node) ||
      (Node.isPropertyAccessExpression(node) && node.getNameNode().getPos() !== identifierPos)
    ) return node;
    if (Node.isPropertyAccessExpression(node))
      return this.getPropertyOrElementAccess(node.getParent(), identifierPos);
    return;
  }

  private static parseElementAccess = (access: ElementAccessExpression, initialType: Type): string | undefined => {
    const argumentExpression = access.getArgumentExpression();
    if (Node.isStringLiteral(argumentExpression)
      || Node.isNoSubstitutionTemplateLiteral(argumentExpression))
      return this.parseStringLiteral(argumentExpression, initialType);
    if (Node.isNumericLiteral(argumentExpression))
      return this.parseNumericLiteral(argumentExpression, initialType);
    if (Node.isTemplateExpression(argumentExpression)
      || argumentExpression?.getType().getBaseTypeOfLiteralType().isStringLiteral())
      return !initialType.getStringIndexType() ? '{ [key: string]: any; }' : undefined;
    if (argumentExpression?.getType().getBaseTypeOfLiteralType().isNumberLiteral())
      return !initialType.getNumberIndexType() && !initialType.getStringIndexType() ? '{ [key: number]: any; }' : undefined;
    if (argumentExpression?.getType().getText() === "symbol")
      return '{ [key: symbol]: any; }';
    if (!initialType.getNumberIndexType() && !initialType.getStringIndexType())
      return `{ [key: string | number | symbol]: any; }`;
    if (!initialType.getStringIndexType())
      return `{ [key: string]: any; }`;
    return;
  }

  private static parseStringLiteral = (literal: StringLiteral | NoSubstitutionTemplateLiteral, initialType: Type): string | undefined => {
    const value = literal.getLiteralValue();
    if (VariableValidator.validVariableName(value)) {
      return !initialType.getProperty(value) ? `{ ${value}: any }` : undefined;
    }
    return !initialType.getStringIndexType() ? '{ [key: string]: any }' : undefined;
  }

  private static parseNumericLiteral = (literal: NumericLiteral, initialType: Type): string | undefined => {
    const value = '' + literal.getLiteralValue();
    if (!initialType.getProperty(value)
      && !initialType.getNumberIndexType()
      && !initialType.getStringIndexType()
    ) {
      return `{ ${value}: any }`;
    }
    return;
  }

  private static isNotDefined = (node: Node) => {
    return !node.getSymbol();
  }
}
