import {
  BindingElement,
  CallExpression, Node,
  ObjectBindingPattern,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";
import {WriteAccessChecker} from "../../helpers/write-access-checker/write-access-checker";
import {VariableValidator} from "../../helpers/variable-validator/variable-validator";


export class ImportValidator {
  static callExpressionFirstArgument = (callExpression: CallExpression): string => {
    return (callExpression.getArguments()[0] as StringLiteral).getLiteralValue();
  }

  static isValidImport = (declaration: VariableDeclaration): boolean => {
    const nameNode = declaration.getNameNode();
    if (Node.isIdentifier(nameNode))
      return !WriteAccessChecker.hasValueChanged(declaration);
    if (Node.isObjectBindingPattern(nameNode))
      return this.validDestructingFormat(nameNode) && !WriteAccessChecker.hasValueChanged(declaration);
    return false;
  }

  private static validPropertyNameNode = (element: BindingElement): boolean => {
    const nameNode = element.getPropertyNameNode();
    if (Node.isIdentifier(nameNode))
      return true;
    if (Node.isStringLiteral(nameNode))
      return VariableValidator.validVariableName(nameNode.getLiteralValue());
    if (Node.isComputedPropertyName(nameNode)) {
      const literal = nameNode.getFirstChildByKind(SyntaxKind.StringLiteral) || nameNode.getFirstChildByKind(SyntaxKind.NoSubstitutionTemplateLiteral);
      return !!literal?.getLiteralValue() && VariableValidator.validVariableName(literal.getLiteralValue());
    }
    return false;
  }

  private static validDestructingFormat = (nameNode: ObjectBindingPattern) => {
    return nameNode
      .getElements()
      .reduce((valid: boolean, element: BindingElement) =>
          valid
          && !element.getDotDotDotToken()
          && !!element.getNameNode().asKind(SyntaxKind.Identifier)
          && this.validPropertyNameNode(element)
        , true)
  }

  static validRequire = (initializer: CallExpression): boolean => {
    const argumentList = initializer.getArguments();
    const identifier = initializer.getFirstChildByKind(SyntaxKind.Identifier);

    return !!identifier
      && identifier.getText() === "require"
      && argumentList
      && argumentList.length > 0
      && argumentList[0].getKind() === SyntaxKind.StringLiteral;
  }
}
