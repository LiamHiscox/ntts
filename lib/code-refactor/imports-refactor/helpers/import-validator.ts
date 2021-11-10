import {
  BindingElement,
  CallExpression,
  ObjectBindingPattern,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";
import {WriteAccessChecker} from "../../helpers/write-access-checker/write-access-checker";
import {VariableValidator} from "../../helpers/variable-validator/variable-validator";


export class ImportValidator {
  static callExpressionFirstArgument(callExpression: CallExpression): string {
    return (callExpression.getArguments()[0] as StringLiteral).getLiteralValue();
  }

  static isValidImport = (declaration: VariableDeclaration): boolean => {
    const nameNode = declaration.getNameNode();
    switch (nameNode.getKind()) {
      case SyntaxKind.Identifier:
        return !WriteAccessChecker.hasValueChanged(declaration);
      case SyntaxKind.ObjectBindingPattern:
        return (
          this.validDestructingFormat(nameNode.asKindOrThrow(SyntaxKind.ObjectBindingPattern))
          && !WriteAccessChecker.hasValueChanged(declaration));
      case SyntaxKind.ArrayBindingPattern:
      default:
        return false;
    }
  }

  private static validPropertyNameNode(element: BindingElement): boolean {
    const nameNode = element.getPropertyNameNode();
    switch (nameNode?.getKind()) {
      case undefined:
      case SyntaxKind.Identifier:
        return true;
      case SyntaxKind.StringLiteral:
        const stringName = nameNode.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
        return !!stringName && VariableValidator.validVariableName(stringName);
      case SyntaxKind.NoSubstitutionTemplateLiteral:
        const subName = nameNode.asKindOrThrow(SyntaxKind.NoSubstitutionTemplateLiteral).getLiteralValue();
        return !!subName && VariableValidator.validVariableName(subName);
      case SyntaxKind.ComputedPropertyName:
        const computed = nameNode.asKindOrThrow(SyntaxKind.ComputedPropertyName);
        const literal = computed.getFirstChildByKind(SyntaxKind.StringLiteral) || computed.getFirstChildByKind(SyntaxKind.NoSubstitutionTemplateLiteral);
        return !!literal?.getLiteralValue() && VariableValidator.validVariableName(literal.getLiteralValue());
      default:
        return false;
    }
  }

  private static validDestructingFormat(nameNode: ObjectBindingPattern) {
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
    return (/^require[ \t]*\(.*?\)$/).test(initializer.getText().trim())
      && argumentList
      && argumentList.length > 0
      && argumentList[0].getKind() === SyntaxKind.StringLiteral;
  }
}
