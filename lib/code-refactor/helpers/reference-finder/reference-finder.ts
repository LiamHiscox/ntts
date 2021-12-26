import { Node, ReferencedSymbol, ReferenceFindableNode } from 'ts-morph';

/*
* this solves the problem in some cases with findReferences() crashing when calling it
* on a Node that is defined outside of the project (e.g. node_modules, globals).
* example:
* console.log("something");
*
* does not work on class extending a default class such as
* class CustomError extends Error {
  name;
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
* */
export const findReferences = (node: ReferenceFindableNode & Node): ReferencedSymbol[] => {
  try {
    node.getSymbol();
    return node.findReferences();
  } catch (e) {
    return [];
  }
};

export const findReferencesAsNodes = (node: ReferenceFindableNode & Node): Node[] => {
  try {
    node.getSymbol();
    return node.findReferencesAsNodes();
  } catch (e) {
    return [];
  }
};
