import {
  BinaryExpression,
  ElementAccessExpression,
  Identifier,
  PropertyAccessExpression,
  SourceFile,
  SyntaxKind
} from "ts-morph";
import {ExportValidator} from "./helpers/export-validator";
import {ExportParser} from "./helpers/export-parser";
import {ExportedVariableModel} from "../../models/exported-variable.model";
import {UsedNames} from "../helpers/used-names/used-names";
import {TopLevelRefactor} from "./top-level-refactor/top-level-refactor";
import {NestedRefactor} from "./nested-refactor/nested-refactor";
import {ExportRename} from "./export-rename/export-rename";

export class ExportsRefactor {
  static moduleExportsToExport(sourceFile: SourceFile) {
    const usedNames = UsedNames.getDeclaredName(sourceFile);

    const exportedVariables = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression).reduce((exportedVariables, node) => {
      if (!node.wasForgotten()) {
        return this.refactorExport(node, exportedVariables, usedNames, sourceFile);
      }
      return exportedVariables;
    }, new Array<ExportedVariableModel>());

    this.insertExports(exportedVariables, sourceFile);
    ExportRename.refactorExportReadAccess(exportedVariables, sourceFile);
  }

  private static insertExports(exportedVariables: ExportedVariableModel[], sourceFile: SourceFile) {
    const exportConfig = exportedVariables.reduce((acc: { _default?: string, named: string[] }, exported) => {
      if (exported.defaultExport) {
        return {...acc, _default: exported.name};
      }
      return {...acc, named: acc.named.concat(exported.alias ? `${exported.name} as ${exported.alias}` : exported.name)};
    }, {named: []});
    if (exportConfig._default) {
      sourceFile.addExportAssignment({expression: exportConfig._default, isExportEquals: false})
    }
    if (exportConfig.named.length > 0) {
      sourceFile.addExportDeclarations([{namedExports: exportConfig.named}]);
    }
  }

  private static refactorExport(binary: BinaryExpression,
                                exportedVariables: ExportedVariableModel[],
                                usedNames: string[],
                                sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const identifiers = ExportValidator.isExportAssigment(binary);
    if (!identifiers) {
      return exportedVariables;
    }
    const filtered = ExportParser.filterExportIdentifiers(identifiers);
    switch (filtered.length) {
      case 0:
        const defaultAccessExpression = ExportParser.getDefaultBaseExport(identifiers);
        return this.refactorDefaultAssignmentExport(binary, defaultAccessExpression, exportedVariables, usedNames, sourceFile);
      case 1:
      default:
        const propertyAccessExpression = ExportParser.getBaseExport(filtered);
        return this.refactorPropertyAccessExport(filtered[0].getText(), binary, propertyAccessExpression, exportedVariables, usedNames, sourceFile);
    }
  }

  private static refactorPropertyAccessExport(exportName: string,
                                              binary: BinaryExpression,
                                              accessExpression: PropertyAccessExpression | ElementAccessExpression,
                                              exportedVariables: ExportedVariableModel[],
                                              usedNames: string[],
                                              sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const parent = binary.getParent()?.asKind(SyntaxKind.ExpressionStatement);
    const grandParent = binary.getParent()?.getParent()?.asKind(SyntaxKind.SourceFile);
    if (parent && grandParent) {
      return TopLevelRefactor.refactorTopLevelExport(exportName, binary, parent, accessExpression, exportedVariables, usedNames, false, sourceFile);
    } else {
      return NestedRefactor.refactorNestedExport(exportName, binary, accessExpression, exportedVariables, usedNames, false, sourceFile);
    }
  }

  private static refactorDefaultAssignmentExport(binary: BinaryExpression,
                                                 accessExpression: Identifier | PropertyAccessExpression | ElementAccessExpression,
                                                 exportedVariables: ExportedVariableModel[],
                                                 usedNames: string[],
                                                 sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const parent = binary.getParent()?.asKind(SyntaxKind.ExpressionStatement);
    const grandParent = binary.getParent()?.getParent()?.asKind(SyntaxKind.SourceFile);
    if (parent && grandParent) {
      return TopLevelRefactor.refactorTopLevelExport("_default", binary, parent, accessExpression, exportedVariables, usedNames, true, sourceFile);
    } else {
      return NestedRefactor.refactorNestedExport("_default", binary, accessExpression, exportedVariables, usedNames, true, sourceFile);
    }
  }
}