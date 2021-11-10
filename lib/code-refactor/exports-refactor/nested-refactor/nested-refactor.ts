import {
  BinaryExpression,
  ElementAccessExpression,
  PropertyAccessExpression,
  SourceFile,
  VariableDeclarationKind
} from "ts-morph";
import {ExportedVariableModel} from "../../../models/exported-variable.model";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {VariableCreator} from "../helpers/variable-creator";
import {ExportParser} from "../helpers/export-parser";

export class NestedRefactor {
  static refactorNestedExport(
    exportName: string,
    binary: BinaryExpression,
    accessExpression: PropertyAccessExpression | ElementAccessExpression,
    exportedVariables: ExportedVariableModel[],
    usedNames: string[],
    sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const exported = ExportParser.exportVariableExists(exportName, exportedVariables);
    if (exported) {
      sourceFile.getVariableStatementOrThrow(exported.name).setDeclarationKind(VariableDeclarationKind.Let);
      accessExpression.replaceWithText(exported.name);
      return exportedVariables;
    } else {
      const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames);
      VariableCreator.createEmptyVariable(usableName, ExportParser.getSourceFileIndex(binary), VariableDeclarationKind.Let, sourceFile);
      accessExpression.replaceWithText(exportName);
      return exportedVariables.concat({
        name: usableName,
        alias: exportName !== usableName ? exportName : undefined
      });
    }
  }
}
