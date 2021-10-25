import {
  Identifier,
  ObjectBindingPattern,
  ReferencedSymbol,
  ReferenceEntry,
  SyntaxKind,
  VariableDeclaration
} from "ts-morph";

export class WriteAccessChecker {
  static hasValueChanged(declaration: VariableDeclaration): boolean {
    return this
      .getIdentifiers(declaration)
      .reduce((acc: boolean, identifier) => acc || this.symbolsHaveWriteAccess(identifier.findReferences()), false);
  }

  private static getIdentifiers(declaration: VariableDeclaration): Identifier[] {
    const nameNode = declaration.getNameNode();
    if (nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
      return (nameNode as ObjectBindingPattern)
        .getElements()
        .map(element => element.getNameNode() as Identifier);
    }
    return [nameNode as Identifier];
  }

  private static symbolsHaveWriteAccess(referencedSymbols: ReferencedSymbol[]): boolean {
    return referencedSymbols.reduce((acc: boolean, symbol) =>
      acc || this.referencesHaveWriteAccess(symbol.getReferences()), false);
  }

  private static referencesHaveWriteAccess(referenceEntries: ReferenceEntry[]): boolean {
    return referenceEntries.reduce((acc: boolean, {isDefinition, isWriteAccess}) =>
      acc || (!isDefinition() && isWriteAccess()), false);
  }
}
