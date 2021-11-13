import {
  BinaryExpression,
  ElementAccessExpression, Identifier,
  PropertyAccessExpression,
  SourceFile,
  VariableDeclarationKind
} from "ts-morph";
import {ExportedVariableModel} from "../../../models/exported-variable.model";
import {VariableNameGenerator} from "../../helpers/variable-name-generator/variable-name-generator";
import {VariableCreator} from "../helpers/variable-creator";
import {ExportParser} from "../helpers/export-parser";

export class NestedRefactor {
  static refactorNestedExport = (exportName: string,
                              binary: BinaryExpression,
                              accessExpression: Identifier | PropertyAccessExpression | ElementAccessExpression,
                              exportedVariables: ExportedVariableModel[],
                              usedNames: string[],
                              defaultExport: boolean,
                              sourceFile: SourceFile
  ): ExportedVariableModel[] => {
    const exported = ExportParser.exportVariableExists(exportName, exportedVariables, defaultExport);
    if (exported) {
      sourceFile.getVariableStatementOrThrow(exported.name).setDeclarationKind(VariableDeclarationKind.Let);
      accessExpression.replaceWithText(exported.name);
      return exportedVariables;
    }
    const exportedNames = exportedVariables.map(e => e.name);
    const usableName = VariableNameGenerator.getUsableVariableName(exportName, usedNames.concat(exportedNames));
    VariableCreator.createEmptyVariable(usableName, ExportParser.getSourceFileIndex(binary), VariableDeclarationKind.Let, sourceFile);
    accessExpression.replaceWithText(usableName);
    return exportedVariables.concat({
      name: usableName,
      alias: exportName !== usableName ? exportName : undefined,
      defaultExport
    });
  }
}
