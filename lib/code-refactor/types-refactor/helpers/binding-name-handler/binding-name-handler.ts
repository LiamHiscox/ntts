import { BindingName, Identifier, Node } from 'ts-morph';

class BindingNameHandler {
  static hasRestVariable = (bindingName: BindingName, result = false): boolean => {
    if (Node.isIdentifier(bindingName)) {
      return result || false;
    }
    if (Node.isArrayBindingPattern(bindingName)) {
      return result || bindingName.getElements().reduce((all: boolean, element) => {
        if (Node.isOmittedExpression(element)) { return all || false; }
        return all || !!element.getDotDotDotToken() || this.hasRestVariable(element.getNameNode());
      }, result);
    }
    return result
      || bindingName.getElements()
        .reduce((all: boolean, element) => all || !!element.getDotDotDotToken() || this.hasRestVariable(element.getNameNode()), result);
  };

  static getIdentifiers = (bindingName: BindingName): Identifier[] => {
    if (Node.isIdentifier(bindingName)) {
      return [bindingName];
    }
    return bindingName.getElements().reduce((acc: Identifier[], node) => {
      if (Node.isOmittedExpression(node)) { return acc; }
      return acc.concat(...this.getIdentifiers(node.getNameNode()));
    }, []);
  };
}

export default BindingNameHandler;
