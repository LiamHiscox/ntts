import {
  ArrayBindingPattern,
  BindingElement,
  BindingName,
  Identifier,
  ObjectBindingPattern,
  OmittedExpression,
  SyntaxKind
} from "ts-morph";

export class VariableParser {
  static getIdentifiers(nameNode: BindingName, result: Identifier[] = []): Identifier[] {
    switch (nameNode.getKind()) {
      case SyntaxKind.ObjectBindingPattern:
        return this.parseBindingPattern(nameNode.asKindOrThrow(SyntaxKind.ObjectBindingPattern), result);
      case SyntaxKind.ArrayBindingPattern:
        return this.parseBindingPattern(nameNode.asKindOrThrow(SyntaxKind.ArrayBindingPattern), result);
      case SyntaxKind.Identifier:
        return result.concat(nameNode.asKindOrThrow(SyntaxKind.Identifier));
      default:
        return [];
    }
  }

  private static parseBindingPattern (nameNode: ArrayBindingPattern|ObjectBindingPattern, result: Identifier[]): Identifier[] {
    const arrayIdentifiers = nameNode
      .getElements()
      .reduce((identifiers: Identifier[], element: BindingElement | OmittedExpression) => {
        const binding = element.asKind(SyntaxKind.BindingElement);
        if (binding) {
          const res = this.getIdentifiers(binding.getNameNode(), result);
          return identifiers.concat(res);
        }
        return identifiers;
      }, new Array<Identifier>());
    return result.concat(arrayIdentifiers);
  }
}
