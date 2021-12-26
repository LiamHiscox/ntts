class VariableValidator {
  private static variableNameRule = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

  static validVariableName = (name: string): boolean => this.variableNameRule.test(name);
}

export default VariableValidator;
