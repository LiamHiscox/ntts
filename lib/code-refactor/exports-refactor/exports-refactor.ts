import {
  BinaryExpression,
  ElementAccessExpression,
  Node,
  PropertyAccessExpression,
  SourceFile,
  SyntaxKind,
  VariableDeclarationKind,
} from 'ts-morph';
import ExportValidator from './helpers/export-validator';
import ExportParser from './helpers/export-parser';
import ExportedVariableModel from '../../models/exported-variable.model';
import UsedNames from '../helpers/used-names/used-names';
import TopLevelRefactor from './top-level-refactor/top-level-refactor';
import NestedRefactor from './nested-refactor/nested-refactor';
import ExportRename from './export-rename/export-rename';
import VariableNameGenerator from '../helpers/variable-name-generator/variable-name-generator';
import VariableCreator from './helpers/variable-creator';
import Logger from '../../logger/logger';
import { AccessExpressionKind } from '../helpers/combined-types/combined-types';

class ExportsRefactor {
  static moduleExportsToExport = (sourceFile: SourceFile) => {
    Logger.info(sourceFile.getFilePath());
    const usedNames = UsedNames.getDeclaredNames(sourceFile);

    const exportedVariables = sourceFile
      .getDescendantsOfKind(SyntaxKind.BinaryExpression)
      .reduce((variables: ExportedVariableModel[], node) => {
        if (!node.wasForgotten()) {
          return this.refactorExport(node, variables, usedNames, sourceFile);
        }
        return variables;
      }, []);

    this.insertExports(exportedVariables, sourceFile);
    ExportRename.refactorExportReadAccess(exportedVariables, sourceFile);
  };

  private static insertExports = (exportedVariables: ExportedVariableModel[], sourceFile: SourceFile) => {
    const exportConfig = exportedVariables.reduce(
      (acc: { _default?: string, named: string[] }, exported) => (exported.defaultExport ? {
        ...acc,
        _default: exported.name,
      } : {
        ...acc,
        named: acc.named.concat(exported.alias ? `${exported.name} as ${exported.alias}` : exported.name),
      }),
      { named: [] },
    );
    if (exportConfig._default) {
      sourceFile.addExportAssignment({ expression: exportConfig._default, isExportEquals: false });
    }
    if (exportConfig.named.length > 0) {
      sourceFile.addExportDeclarations([{ namedExports: exportConfig.named }]);
    }
  };

  private static refactorExport = (
    binary: BinaryExpression,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    const identifiers = ExportValidator.isExportAssigment(binary);
    if (!identifiers) {
      return exportedVariables;
    }
    const filtered = ExportParser.filterExportIdentifiers(identifiers);
    switch (filtered.length) {
      case 0:
        return this.refactorElementAccessOrDefaultExport(
          binary,
          ExportParser.getElementAccessOrDefaultBaseExport(identifiers),
          exportedVariables,
          usedNames,
          sourceFile,
        );
      case 1:
      default:
        return this.refactorPropertyAccessExport(
          filtered[0].getText(),
          binary,
          ExportParser.getBaseExport(filtered),
          exportedVariables,
          usedNames,
          sourceFile,
        );
    }
  };

  private static refactorPropertyAccessExport = (
    exportName: string,
    binary: BinaryExpression,
    accessExpression: PropertyAccessExpression | ElementAccessExpression,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    const parent = binary.getParent();
    const grandParent = parent?.getParent();
    if (Node.isExpressionStatement(parent) && Node.isSourceFile(grandParent)) {
      return TopLevelRefactor.refactorTopLevelExport(exportName, binary, parent, accessExpression, exportedVariables, usedNames, false, sourceFile);
    }
    return NestedRefactor.refactorNestedExport(exportName, binary, accessExpression, exportedVariables, usedNames, false, sourceFile);
  };

  private static refactorElementAccessOrDefaultExport = (
    binary: BinaryExpression,
    accessExpression: AccessExpressionKind,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    if (Node.isElementAccessExpression(accessExpression) && !ExportParser.exportVariableExists('', exportedVariables, true)) {
      return this.refactorNewElementAccessDefaultExport(binary, accessExpression, exportedVariables, usedNames, sourceFile);
    }
    return this.refactorDefaultAssignmentExport(binary, accessExpression, exportedVariables, usedNames, sourceFile);
  };

  private static refactorDefaultAssignmentExport = (
    binary: BinaryExpression,
    accessExpression: AccessExpressionKind,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    const parent = binary.getParent();
    const grandParent = parent?.getParent();
    if (Node.isExpressionStatement(parent) && Node.isSourceFile(grandParent)) {
      return TopLevelRefactor.refactorTopLevelExport(
        this.variableFromFileName(sourceFile),
        binary,
        parent,
        accessExpression,
        exportedVariables,
        usedNames,
        true,
        sourceFile
      );
    }
    return NestedRefactor.refactorNestedExport(
        this.variableFromFileName(sourceFile),
      binary,
      accessExpression,
      exportedVariables,
      usedNames,
      true,
      sourceFile
    );
  };

  private static variableFromFileName = (sourceFile: SourceFile) => {
    const parts = sourceFile.getFilePath().split('/');
    if (parts.length > 0) {
      return VariableNameGenerator.variableNameFromImportId(parts[parts.length - 1]);
    }
    return '_default';
  };

  private static refactorNewElementAccessDefaultExport = (
    binary: BinaryExpression,
    elementAccess: ElementAccessExpression,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    const exportedNames = exportedVariables.map((e) => e.name);
    const exportName = this.variableFromFileName(sourceFile);
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames.concat(exportedNames));
    const index = ExportParser.getSourceFileIndex(binary);
    VariableCreator.createVariable(usableName, index, '{}', VariableDeclarationKind.Let, sourceFile);
    const newDefaultExport = { name: usableName, defaultExport: true };
    const expression = elementAccess.getExpression();
    if (Node.isIdentifier(expression)
      || Node.isPropertyAccessExpression(expression)
      || Node.isElementAccessExpression(expression)) {
      return this.refactorDefaultAssignmentExport(binary, expression, exportedVariables.concat(newDefaultExport), usedNames, sourceFile);
    }
    return exportedVariables;
  };
}

export default ExportsRefactor;
