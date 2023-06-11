import {
  BinaryExpression,
  SourceFile,
  VariableDeclarationKind,
} from 'ts-morph';
import ExportedVariableModel from '../../../models/exported-variable.model';
import VariableNameGenerator from '../../helpers/variable-name-generator/variable-name-generator';
import VariableCreator from '../helpers/variable-creator';
import ExportParser from '../helpers/export-parser';
import { AccessExpressionKind } from '../../helpers/combined-types/combined-types';

class NestedRefactor {
  static refactorNestedExport = (
    exportName: string,
    binary: BinaryExpression,
    accessExpression: AccessExpressionKind,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    defaultExport: boolean,
    sourceFile: SourceFile,
  ): ExportedVariableModel[] => {
    const exported = ExportParser.exportVariableExists(exportName, exportedVariables, defaultExport);
    const exportedNames = exportedVariables.map((e) => e.name);
    if (exported) {
      sourceFile.getVariableStatementOrThrow(exported.name).setDeclarationKind(VariableDeclarationKind.Let);
      accessExpression.replaceWithText(exported.name);
      return exportedVariables;
    }
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames.concat(exportedNames));
    VariableCreator.createEmptyVariable(usableName, ExportParser.getSourceFileIndex(binary), VariableDeclarationKind.Let, sourceFile);
    accessExpression.replaceWithText(usableName);
    return exportedVariables.concat({
      name: usableName,
      alias: exportName !== usableName ? exportName : undefined,
      defaultExport,
    });
  };
}

export default NestedRefactor;
