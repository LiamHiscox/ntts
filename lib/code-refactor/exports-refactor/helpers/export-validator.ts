import {BinaryExpression, Identifier, Node, SyntaxKind} from "ts-morph";
import {ExportParser} from "./export-parser";
import {ExportedVariableModel} from "../../../models/exported-variable.model";

export class ExportValidator {
  private static isExport(identifiers: (Identifier | null)[]): Identifier[] | undefined {
    return this.isDefaultExport(identifiers) || this.isNamedExport(identifiers);
  }

  static isExportAssigment(binary: BinaryExpression): Identifier[] | undefined {
    const left = binary.getLeft().asKind(SyntaxKind.Identifier)
      || binary.getLeft().asKind(SyntaxKind.PropertyAccessExpression)
      || binary.getLeft().asKind(SyntaxKind.ElementAccessExpression);
    if (!binary.getOperatorToken().asKind(SyntaxKind.EqualsToken) || !left) {
      return;
    }
    const identifiers = this.isExport(ExportParser.flatten(left));
    if (identifiers && identifiers[0] && identifiers[0].getImplementations().length <= 0) {
      return identifiers;
    }
    return;
  }

  static isNamedExport(identifiers: (Identifier | null)[]): Identifier[] | undefined {
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


  static isDefaultExport(identifiers: (Identifier | null)[]): Identifier[] | undefined {
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

  static validObjetLiteralExpression(node: Node): boolean {
    const objectLiteral = node.asKind(SyntaxKind.ObjectLiteralExpression);
    const validLiteral = objectLiteral?.getProperties().reduce((valid, property) => {
      switch (property.getKind()) {
        case SyntaxKind.PropertyAssignment:
          return valid && !!property.asKindOrThrow(SyntaxKind.PropertyAssignment).getNameNode().asKind(SyntaxKind.Identifier);
        case SyntaxKind.ShorthandPropertyAssignment:
          return valid && true;
        default:
          return valid && false;
      }
      }, true);
    return !!objectLiteral && !!validLiteral;
  }

  static hasDefaultExport(exportedVariables: ExportedVariableModel[]): boolean {
    return !!exportedVariables.find(exported => !!exported.defaultExport);
  }
}
