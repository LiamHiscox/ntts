import reservedKeywords from '../../../assets/reserved-keywords';

class VariableNameGenerator {
  static variableNameFromImportId = (importId: string) => {
    const splitPath = importId.split('/');
    const newName = splitPath[splitPath.length - 1]
      .replace(/\.ts$/, '')
      .replace(/[^_\d\w$]/g, '_')
      .replace(/^_+/, '')
      .replace(/_+$/, '');
    if (newName.match(/^\d.*$/)) {
      return `_${newName}`;
    }
    if (!newName) {
      return '_';
    }
    return newName;
  };

  static getUsableVariableName = (name: string, usedNames: string[]) => {
    if (!usedNames.includes(name) && !reservedKeywords.includes(name)) {
      return name;
    }
    const underscoreName = `_${name}`;
    if (!usedNames.includes(underscoreName) && !reservedKeywords.includes(underscoreName)) {
      return underscoreName;
    }
    return this.iterateVariableNames(name, 0, usedNames);
  };

  private static iterateVariableNames = (name: string, counter: number, usedNames: string[]): string => {
    const newName = name + counter;
    if (usedNames.includes(newName) || reservedKeywords.includes(newName)) {
      const newCounter = counter + 1;
      return this.iterateVariableNames(name, newCounter, usedNames);
    }
    return newName;
  };
}

export default VariableNameGenerator;
