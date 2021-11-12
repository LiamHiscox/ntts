import {
  ElementAccessExpression,
  Identifier,
  Node,
  PropertyAccessExpression,
  SyntaxKind
} from "ts-morph";
import {ExportedVariableModel} from "../../../models/exported-variable.model";

export class ExportParser {
  static flatten(node: Node, result: (Identifier | null)[] = []): (Identifier | null)[] {
    switch (node.getKind()) {
      case SyntaxKind.PropertyAccessExpression:
        const propertyAccess = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        return this.flatten(propertyAccess.getExpression(), [propertyAccess.getNameNode(), ...result]);
      case SyntaxKind.ElementAccessExpression:
        const elementAccess = node.asKindOrThrow(SyntaxKind.ElementAccessExpression);
        elementAccess.getExpression();
        return this.flatten(elementAccess.getExpression(), [null, ...result]);
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

  static getSourceFileIndex(node: Node): number {
    const sourceFile = node.getParent()?.asKind(SyntaxKind.SourceFile);
    if (sourceFile) {
      return node.getChildIndex();
    }
    return this.getSourceFileIndex(node.getParentOrThrow());
  }

  static exportVariableExists(variableName: string, exportedVariables: ExportedVariableModel[], defaultExport: boolean): ExportedVariableModel | undefined {
    if (defaultExport) {
      return exportedVariables.find(exported => !!exported.defaultExport);
    }
    return exportedVariables
      .find(exported =>
        (!exported.alias && exported.name === variableName)
        || (!!exported.alias && exported.alias === variableName));
  }

  static getBaseExport(identifiers: Identifier[]): PropertyAccessExpression {
    const parent = identifiers[0].getParent();
    return parent.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
  }

  static getElementAccessOrDefaultBaseExport(identifiers: Identifier[]): Identifier | PropertyAccessExpression | ElementAccessExpression {
    if (identifiers.length === 1) {
      return identifiers[0].getParent().asKind(SyntaxKind.ElementAccessExpression) || identifiers[0];
    }
    return identifiers[0].getParent().getParentIfKind(SyntaxKind.ElementAccessExpression) || this.getBaseExport(identifiers);
  }
}
