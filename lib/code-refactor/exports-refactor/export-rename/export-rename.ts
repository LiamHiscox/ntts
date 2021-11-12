import {Identifier, PropertyAccessExpression, SourceFile, SyntaxKind} from "ts-morph";
import {ExportedVariableModel} from "../../../models/exported-variable.model";
import {ExportParser} from "../helpers/export-parser";

export class ExportRename {
  static refactorExportReadAccess(exportedVariables: ExportedVariableModel[], sourceFile: SourceFile) {
    sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach(identifier => {
      if (identifier.getText() === 'exports') {
        this.renameExportAccess(identifier, exportedVariables);
      }
    })
  }

  private static renameExportAccess(identifier: Identifier, exportedVariables: ExportedVariableModel[]) {
    if (this.isDefaultExportAccess(identifier)) {
      const propertyAccess = this.getDefaultExport(identifier);
      const _default = ExportParser.exportVariableExists("_default", exportedVariables, true);
      _default && propertyAccess.replaceWithText(_default.name);
    } else {
      const propertyAccess = this.getNamedExport(identifier);
      const exportName = propertyAccess.getNameNode().getText();
      const exported = ExportParser.exportVariableExists(exportName, exportedVariables, false);
      exported && propertyAccess.replaceWithText(exported.name);
    }
  }

  private static getDefaultExport(identifier: Identifier): Identifier | PropertyAccessExpression {
    const parent = identifier.getParent().asKind(SyntaxKind.PropertyAccessExpression);
    return parent ? parent : identifier;
  }

  private static getNamedExport(identifier: Identifier): PropertyAccessExpression {
    return identifier.getParent().getParentOrThrow().asKindOrThrow(SyntaxKind.PropertyAccessExpression);
  }

  private static isDefaultExportAccess(identifier: Identifier): boolean {
    const parent = identifier.getParent().asKind(SyntaxKind.PropertyAccessExpression);
    const grandParent = parent?.getParent()?.asKind(SyntaxKind.PropertyAccessExpression);

    if (!parent) {
      return true;
    } else if (grandParent?.asKind(SyntaxKind.PropertyAccessExpression)) {
      return false;
    }
    return true;
  }
}
