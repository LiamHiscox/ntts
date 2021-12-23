import {
  EntityNameExpression, Identifier, Node, SourceFile, SyntaxKind,
} from 'ts-morph';
import ExportedVariableModel from '../../../models/exported-variable.model';
import ExportParser from '../helpers/export-parser';
import ExportValidator from '../helpers/export-validator';
import { AccessExpressionKind } from '../../helpers/combined-types/combined-types';

class ExportRename {
  static refactorExportReadAccess = (exportedVariables: ExportedVariableModel[], sourceFile: SourceFile) => {
    sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach((identifier) => {
      if (!identifier.wasForgotten() && identifier.getText() === 'exports') {
        this.renameExportAccess(identifier, exportedVariables);
      }
    });
  };

  private static renameExportAccess = (identifier: Identifier, exportedVariables: ExportedVariableModel[]) => {
    const access = ExportParser.flatten(this.getLastPropertyAccess(identifier));
    const namedExport = ExportValidator.isNamedExport(access);
    if (!!ExportValidator.isDefaultExport(access) || !!ExportValidator.isElementAccessExport(access)) {
      const propertyAccess = this.getDefaultExport(identifier);
      const _default = ExportParser.exportVariableExists('', exportedVariables, true);
      _default && propertyAccess.replaceWithText(_default.name);
    } else if (namedExport) {
      const filtered = ExportParser.filterExportIdentifiers(namedExport);
      const exportName = filtered[0].getText();
      const exported = ExportParser.exportVariableExists(exportName, exportedVariables, false);
      exported && filtered[0].getParent().replaceWithText(exported.name);
    }
  };

  private static getDefaultExport = (identifier: Identifier): EntityNameExpression => {
    const parent = identifier.getParent();
    return Node.isPropertyAccessExpression(parent) ? parent : identifier;
  };

  private static getLastPropertyAccess = (identifier: AccessExpressionKind): AccessExpressionKind => {
    const parent = identifier.getParent();
    if (Node.isPropertyAccessExpression(parent) || Node.isElementAccessExpression(parent)) {
      return this.getLastPropertyAccess(parent);
    }
    return identifier;
  };
}

export default ExportRename;
