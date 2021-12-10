import {
  BindingElement,
  CallExpression, NewExpression, Node,
  ObjectBindingPattern,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";
import {WriteAccessChecker} from "../../helpers/write-access-checker/write-access-checker";
import {VariableValidator} from "../../helpers/variable-validator/variable-validator";
import {getInnerExpression} from "../../helpers/expression-handler/expression-handler";


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
    if (!nameNode || Node.isIdentifier(nameNode))
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

  static validRequire = (initializer: CallExpression | NewExpression): boolean => {
    const argumentList = initializer.getArguments();
    const innerExpression = getInnerExpression(initializer.getExpression());
    return Node.isIdentifier(innerExpression)
      && innerExpression.getText() === "require"
      && argumentList
      && argumentList.length > 0
      && Node.isStringLiteral(argumentList[0]);
  }
}
