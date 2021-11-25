import {
  ArrayBindingPattern,
  BindingElement,
  BindingName,
  Identifier,
  Node,
  ObjectBindingPattern,
  OmittedExpression
} from "ts-morph";

export class VariableParser {
  static getIdentifiers = (nameNode: BindingName, result: Identifier[] = []): Identifier[] => {
    if (Node.isObjectBindingPattern(nameNode))
      return this.parseBindingPattern(nameNode, result);
    if (Node.isArrayBindingPattern(nameNode))
      return this.parseBindingPattern(nameNode, result);
    if (Node.isIdentifier(nameNode))
      return result.concat(nameNode);
    return [];
  }

  private static parseBindingPattern = (nameNode: ArrayBindingPattern|ObjectBindingPattern, result: Identifier[]): Identifier[] => {
    const arrayIdentifiers = nameNode
      .getElements()
      .reduce((identifiers: Identifier[], element: BindingElement | OmittedExpression) => {
        if (Node.isBindingElement(element)) {
          const res = this.getIdentifiers(element.getNameNode(), result);
          return identifiers.concat(res);
        }
        return identifiers;
      }, new Array<Identifier>());
    return result.concat(arrayIdentifiers);
  }
}
