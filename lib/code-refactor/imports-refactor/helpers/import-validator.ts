import {
  BindingElement,
  CallExpression,
  ObjectBindingPattern,
  StringLiteral,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";
import {WriteAccessChecker} from "./write-access-checker";

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
        return this.validDestructingFormat((nameNode as ObjectBindingPattern))
          && !WriteAccessChecker.hasValueChanged(declaration);
      case SyntaxKind.ArrayBindingPattern:
      default:
        return false;
    }
  }

  private static validPropertyNameNode(element: BindingElement): boolean {
    const nameNode = element.getPropertyNameNode();
    return !nameNode
      || !!nameNode.asKind(SyntaxKind.Identifier)
      || !!nameNode.asKind(SyntaxKind.StringLiteral)?.getLiteralValue()
      || !!nameNode
        .asKind(SyntaxKind.ComputedPropertyName)
        ?.getFirstChildByKind(SyntaxKind.StringLiteral)
        ?.getLiteralValue();
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
