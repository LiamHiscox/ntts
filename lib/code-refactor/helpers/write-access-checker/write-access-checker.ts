import {
  BindingName,
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
      .getIdentifiers(declaration.getNameNode())
      .reduce((acc: boolean, identifier) => acc || this.symbolsHaveWriteAccess(identifier.findReferences()), false);
  }

  private static getIdentifiers(nameNode: BindingName, result: Identifier[] = []): Identifier[] {
    switch (nameNode.getKind()) {
      case SyntaxKind.ObjectBindingPattern:
        const objectIdentifiers = nameNode
          .asKindOrThrow(SyntaxKind.ObjectBindingPattern)
          .getElements()
          .reduce((identifiers, element) => {
            const res = this.getIdentifiers(element.asKindOrThrow(SyntaxKind.BindingElement).getNameNode(), result);
            return identifiers.concat(res);
          }, new Array<Identifier>());
        return result.concat(objectIdentifiers);

      case SyntaxKind.ArrayBindingPattern:
        const arrayIdentifiers = nameNode
          .asKindOrThrow(SyntaxKind.ArrayBindingPattern)
          .getElements()
          .reduce((identifiers, element) => {
            if (element.getKind() === SyntaxKind.BindingElement) {
              const res = this.getIdentifiers(element.asKindOrThrow(SyntaxKind.BindingElement).getNameNode(), result);
              return identifiers.concat(res);
            }
            return identifiers;
          }, new Array<Identifier>());
        return result.concat(arrayIdentifiers);

      case SyntaxKind.Identifier:
        return result.concat(nameNode.asKindOrThrow(SyntaxKind.Identifier));
    }

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
    return referenceEntries.reduce((acc: boolean, entry) =>
      acc || (!entry.isDefinition() && entry.isWriteAccess()), false);
  }
}
