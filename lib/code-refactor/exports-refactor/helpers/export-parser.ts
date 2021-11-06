import {Identifier, Node, SyntaxKind} from "ts-morph";

export class ExportParser {
  static flatten(node: Node, result: Identifier[] = []): Identifier[] {
    switch (node.getKind()) {
      case SyntaxKind.PropertyAccessExpression:
        const propertyAccess = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        return this.flatten(propertyAccess.getExpression(), [propertyAccess.getNameNode(), ...result]);
      // case SyntaxKind.ElementAccessExpression:
      case SyntaxKind.Identifier:
        return [node.asKindOrThrow(SyntaxKind.Identifier), ...result];
      default:
        return result;
    }
  }

  static filterExportIdentifiers(identifiers: Identifier[]) {
    if (identifiers[0].getText() === "module") {
      return identifiers.slice(2);
    }
    return identifiers.slice(1);
  }
}
