import {BindingElement, ObjectBindingPattern, SyntaxKind, VariableDeclaration} from "ts-morph";
import {WriteAccessChecker} from "./write-access-checker";

export class ImportValidator {
  static isValidImport = (declaration: VariableDeclaration): boolean => {
    const nameNode = declaration.getNameNode();
    switch (nameNode.getKind()) {
      case SyntaxKind.Identifier:
        return WriteAccessChecker.hasValueChanged(declaration);
      case SyntaxKind.ObjectBindingPattern:
        if (this.validDestructingFormat((nameNode as ObjectBindingPattern))) {
          return WriteAccessChecker.hasValueChanged(declaration);
        }
        return false;
      case SyntaxKind.ArrayBindingPattern:
      default:
        return false;
    }
  }

  private static validDestructingFormat(nameNode: ObjectBindingPattern) {
    return nameNode
      .getElements()
      .reduce((valid: boolean, element: BindingElement) =>
        valid && !element.getDotDotDotToken() && !!element.getNameNode().asKind(SyntaxKind.Identifier), true)
  }
}
