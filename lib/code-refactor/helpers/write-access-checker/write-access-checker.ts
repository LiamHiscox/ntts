import {ReferencedSymbol, ReferencedSymbolEntry, VariableDeclaration} from 'ts-morph';
import VariableParser from '../variable-parser/variable-parser';
import { findReferences } from '../reference-finder/reference-finder';

class WriteAccessChecker {
  static hasValueChanged = (declaration: VariableDeclaration): boolean => VariableParser
    .getIdentifiers(declaration.getNameNode())
    .reduce((acc: boolean, identifier) => acc || this.symbolsHaveWriteAccess(findReferences(identifier)), false);

  private static symbolsHaveWriteAccess = (referencedSymbols: ReferencedSymbol[]): boolean => referencedSymbols
    .reduce((acc: boolean, symbol) => acc || this.referencesHaveWriteAccess(symbol.getReferences()), false);

  private static referencesHaveWriteAccess = (referenceEntries: ReferencedSymbolEntry[]): boolean => referenceEntries
    .reduce((acc: boolean, entry) => acc || (!entry.isDefinition() && entry.isWriteAccess()), false);
}

export default WriteAccessChecker;
