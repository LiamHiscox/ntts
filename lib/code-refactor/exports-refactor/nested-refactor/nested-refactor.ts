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
    usedVariables: string[],
    sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const exported = ExportParser.exportVariableExists(exportName, exportedVariables);
    if (exported) {
      accessExpression.replaceWithText(exported.name);
      return exportedVariables;
    } else {
      const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedVariables, sourceFile);
      VariableCreator.createEmptyVariable(usableName, ExportParser.getSourceFileIndex(binary), VariableDeclarationKind.Let, sourceFile);
      accessExpression.replaceWithText(exportName);
      return exportedVariables.concat({
        name: usableName,
        alias: exportName !== usableName ? exportName : undefined
      });
    }
  }
}
