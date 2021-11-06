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

  static getUsableVariableName(name: string, usedVariables: string[], sourceFile: SourceFile) {
    if (usedVariables.includes(name) || reservedKeywords.includes(name)) {
      return this.iterateVariableNames(name, 0, usedVariables, sourceFile);
    }
    return name;
  }

  private static iterateVariableNames(name: string, counter: number, usedVariables: string[], sourceFile: SourceFile): string {
    const newName = name + counter;
    if (usedVariables.includes(newName) || reservedKeywords.includes(name)) {
      return this.iterateVariableNames(name, counter++, usedVariables, sourceFile);
    }
    return newName;
  }
}
