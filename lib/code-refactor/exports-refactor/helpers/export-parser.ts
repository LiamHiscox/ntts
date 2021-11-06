import {ElementAccessExpression, Identifier, Node, PropertyAccessExpression, SyntaxKind} from "ts-morph";
import {ExportedVariableModel} from "../../../models/exported-variable.model";

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

  static getSourceFileIndex(node: Node): number {
    const sourceFile = node.getParent()?.asKind(SyntaxKind.SourceFile);
    if (sourceFile) {
      return node.getChildIndex();
    }
    return this.getSourceFileIndex(node.getParentOrThrow());
  }

  static exportVariableExists(variableName: string, exportedVariables: ExportedVariableModel[]): ExportedVariableModel | undefined {
    return exportedVariables
      .find(exported =>
        (!exported.alias && exported.name === variableName)
        || (!!exported.alias && exported.alias === variableName));
  }

  static getBaseExport(identifiers: Identifier[]): PropertyAccessExpression | ElementAccessExpression {
    const parent = identifiers[0].getParent();
    return parent.asKind(SyntaxKind.PropertyAccessExpression) || parent.asKindOrThrow(SyntaxKind.ElementAccessExpression);
  }
}
