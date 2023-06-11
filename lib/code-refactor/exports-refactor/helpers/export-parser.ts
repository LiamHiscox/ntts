import {
  Identifier,
  Node,
  PropertyAccessExpression,
  SyntaxKind,
} from 'ts-morph';
import ExportedVariableModel from '../../../models/exported-variable.model.js';
import { AccessExpressionKind } from '../../helpers/combined-types/combined-types.js';

class ExportParser {
  static flatten = (node: Node, result: (Identifier | null)[] = []): (Identifier | null)[] => {
    if (Node.isPropertyAccessExpression(node)) {
      return this.flatten(node.getExpression(), [node.getNameNode(), ...result]);
    }
    if (Node.isElementAccessExpression(node)) {
      return this.flatten(node.getExpression(), [null, ...result]);
    }
    if (Node.isIdentifier(node)) {
      return [node, ...result];
    }
    return result;
  };

  static filterExportIdentifiers = (identifiers: Identifier[]) => {
    if (identifiers[0].getText() === 'module') {
      return identifiers.slice(2);
    }
    return identifiers.slice(1);
  };

  static getSourceFileIndex = (node: Node): number => {
    const parent = node.getParent();
    if (Node.isSourceFile(parent)) {
      return node.getChildIndex();
    }
    return this.getSourceFileIndex(node.getParentOrThrow());
  };

  static exportVariableExists = (
    variableName: string,
    exportedVariables: ExportedVariableModel[],
    defaultExport: boolean,
  ): ExportedVariableModel | undefined => {
    if (defaultExport) {
      return exportedVariables.find((exported) => !!exported.defaultExport);
    }
    return exportedVariables
      .find((exported) => (!exported.alias && exported.name === variableName)
        || (!!exported.alias && exported.alias === variableName));
  };

  static getBaseExport = (identifiers: Identifier[]): PropertyAccessExpression => {
    const parent = identifiers[0].getParent();
    return parent.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
  };

  static getElementAccessOrDefaultBaseExport = (identifiers: Identifier[]): AccessExpressionKind => {
    if (identifiers.length === 1) {
      return identifiers[0].getParent().asKind(SyntaxKind.ElementAccessExpression) || identifiers[0];
    }
    return identifiers[0].getParent().getParentIfKind(SyntaxKind.ElementAccessExpression) || this.getBaseExport(identifiers);
  };
}

export default ExportParser;
