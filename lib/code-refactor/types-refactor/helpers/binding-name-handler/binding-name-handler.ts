import {BindingName, Node} from "ts-morph";

export class BindingNameHandler {
  static hasRestVariable = (bindingName: BindingName, result: boolean = false): boolean => {
    if (Node.isIdentifier(bindingName)) {
      return result || false;
    }
    if (Node.isArrayBindingPattern(bindingName)) {
      return result || bindingName.getElements().reduce((all: boolean, element) => {
        if (Node.isOmittedExpression(element))
          return all || false;
        return all || !!element.getDotDotDotToken() || this.hasRestVariable(element.getNameNode());
      }, result);
    }
    return result || bindingName.getElements().reduce((all: boolean, element) =>
      all || !!element.getDotDotDotToken() || this.hasRestVariable(element.getNameNode()), result)
  }
}
