import {SourceFile} from "ts-morph";
import {reservedKeywords} from "../../../assets/reserved-keywords";

export class VariableNameGenerator {
  static variableNameFromImportId(importId: string) {
    const newName = importId.replace(/[^_\d\w$]/g, '_');
    if (newName.match(/^\d.*$/)) {
      return '_' + newName;
    }
    return newName;
  }

  static getUsableVariableName(name: string, sourceFile: SourceFile) {
    if (sourceFile.getVariableStatement(name) || reservedKeywords.includes(name)) {
      return this.iterateVariableNames(name, 0, sourceFile);
    }
    return name;
  }

  private static iterateVariableNames(name: string, counter: number, sourceFile: SourceFile): string {
    const newName = name + counter;
    if (sourceFile.getVariableStatement(newName) || reservedKeywords.includes(name)) {
      return this.iterateVariableNames(name, counter++, sourceFile);
    }
    return newName;
  }
}
