import {reservedKeywords} from "../../../assets/reserved-keywords";

export class VariableNameGenerator {
  static variableNameFromImportId(importId: string) {
    const newName = importId
      .replace(/[^_\d\w$]/g, '_')
      .replace(/^_+/, '')
      .replace(/_+$/, '');
    if (newName.match(/^\d.*$/)) {
      return '_' + newName;
    }
    return newName;
  }

  static getUsableVariableName(name: string, usedNames: string[]) {
    if (usedNames.includes(name) || reservedKeywords.includes(name)) {
      return this.iterateVariableNames(name, 0, usedNames);
    }
    return name;
  }

  private static iterateVariableNames(name: string, counter: number, usedNames: string[]): string {
    const newName = name + counter;
    if (usedNames.includes(newName) || reservedKeywords.includes(newName)) {
      return this.iterateVariableNames(name, ++counter, usedNames);
    }
    return newName;
  }
}
