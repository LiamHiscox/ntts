import {ReferencedSymbol, ReferenceEntry, VariableDeclaration} from "ts-morph";
import {VariableParser} from "../variable-parser/variable-parser";

export class WriteAccessChecker {
  static hasValueChanged(declaration: VariableDeclaration): boolean {
    return VariableParser
      .getIdentifiers(declaration.getNameNode())
      .reduce((acc: boolean, identifier) => acc || this.symbolsHaveWriteAccess(identifier.findReferences()), false);
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
