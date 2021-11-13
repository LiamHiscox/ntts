export class VariableValidator {
  static variableNameRule = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

  static validVariableName = (name: string): boolean => {
    return this.variableNameRule.test(name);
  }
}
