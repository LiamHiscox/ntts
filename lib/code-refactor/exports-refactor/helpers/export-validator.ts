import {BinaryExpression, Identifier, SyntaxKind} from "ts-morph";
import {ExportParser} from "./export-parser";

export class ExportValidator {
  private static isExport = (identifiers: (Identifier | null)[]): Identifier[] | undefined => {
    return this.isDefaultExport(identifiers)
      || this.isNamedExport(identifiers)
      || this.isElementAccessExport(identifiers);
  }

  static isExportAssigment = (binary: BinaryExpression): Identifier[] | undefined => {
    const left = binary.getLeft().asKind(SyntaxKind.Identifier)
      || binary.getLeft().asKind(SyntaxKind.PropertyAccessExpression)
      || binary.getLeft().asKind(SyntaxKind.ElementAccessExpression);
    if (!binary.getOperatorToken().asKind(SyntaxKind.EqualsToken) || !left) {
      return;
    }
    const identifiers = this.isExport(ExportParser.flatten(left));
    if (identifiers && identifiers[0]) {
      return identifiers;
    }
    return;
  }

  static isNamedExport = (identifiers: (Identifier | null)[]): Identifier[] | undefined => {
    if (identifiers.length > 2
      && identifiers[0] && identifiers[0].getText() === "module"
      && identifiers[1] && identifiers[1].getText() === "exports"
      && identifiers[2]
    ) {
      return [identifiers[0], identifiers[1], identifiers[2]];
    } else if (
      identifiers.length > 1
      && identifiers[0] && identifiers[0].getText() === "exports"
      && identifiers[1]
    ) {
      return [identifiers[0], identifiers[1]];
    }
    return;
  }

  static isDefaultExport = (identifiers: (Identifier | null)[]): Identifier[] | undefined => {
    if (identifiers.length === 2
      && identifiers[0] && identifiers[0].getText() === "module"
      && identifiers[1] && identifiers[1].getText() === "exports"
    ) {
      return [identifiers[0], identifiers[1]];
    }  else if (
      identifiers.length === 1
      && identifiers[0] && identifiers[0].getText() === "exports"
    ) {
      return [identifiers[0]];
    }
    return;
  }

  static isElementAccessExport = (identifiers: (Identifier | null)[]): Identifier[] | undefined => {
    if (identifiers.length > 2
      && identifiers[0] && identifiers[0].getText() === "module"
      && identifiers[1] && identifiers[1].getText() === "exports"
      && !identifiers[2]
    ) {
      return [identifiers[0], identifiers[1]];
    }  else if (
      identifiers.length > 1
      && identifiers[0] && identifiers[0].getText() === "exports"
      && !identifiers[1]
    ) {
      return [identifiers[0]];
    }
    return;
  }
}
