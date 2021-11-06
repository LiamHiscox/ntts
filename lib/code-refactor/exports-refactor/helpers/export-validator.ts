import {BinaryExpression, Identifier, SyntaxKind} from "ts-morph";
import {ExportParser} from "./export-parser";

export class ExportValidator {
  static isExport(identifiers: Identifier[]): boolean {
    return (
      identifiers[0].getText() === "exports"
      || (
        identifiers[0].getText() === "module"
        && identifiers[1].getText() === "exports"
      )
    );
  }

  static isExportAssigment(binary: BinaryExpression): Identifier[] | undefined {
    if (!binary.getOperatorToken().asKind(SyntaxKind.EqualsToken)) {
      return;
    }
    const left = binary.getLeft();
    const flattened = ExportParser.flatten(left);
    if (
      left.getKind() === SyntaxKind.Identifier
      || left.getKind() === SyntaxKind.PropertyAccessExpression
      || this.isExport(flattened)
    ) {
      return flattened;
    }
    return;
  }
}
