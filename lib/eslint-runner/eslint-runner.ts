import { ESLint } from 'eslint';
import DependencyHandler from '../dependency-installer/dependency-handler/dependency-handler.js';

const packageGlobals = [
  { npm: 'mocha', eslint: 'mocha' },
  { npm: 'jasmine', eslint: 'jasmine' },
  { npm: 'jest', eslint: 'jest' },
  { npm: 'qunit', eslint: 'qunit' },
  { npm: 'shelljs', eslint: 'shelljs' },
  { npm: 'mongodb', eslint: 'mongo' },
];

class EslintRunner {
  static getLinter = async (ignorePatterns: string[]) => {
    const packages = Object.keys(await DependencyHandler.installedPackages());
    const usedPackages = packageGlobals
      .reduce((env: { [key: string]: boolean }, p) => {
        if (packages.includes(p.npm)) {
          return { ...env, [p.eslint]: true };
        }
        return env;
      }, {});

    return new ESLint({
      fix: true,
      errorOnUnmatchedPattern: false,
      baseConfig: {
        ignorePatterns,
        parserOptions: {
          ecmaVersion: "latest",
        },
        env: {
          commonjs: true,
          node: true,
          es2021: true,
          ...usedPackages,
        },
        rules: {
          'no-debugger': 'warn',
          'no-constant-condition': 'warn',
          'no-empty-character-class': 'warn',
          'no-fallthrough': 'warn',
          'no-unexpected-multiline': 'warn',
          'no-unused-vars': 'warn',
          'no-empty': 'warn',
          'no-useless-escape': 'warn',
          'no-prototype-builtins': 'warn',
          'no-mixed-spaces-and-tabs': 'warn',
        },
        extends: 'eslint:recommended',
      },
    });
  };

  static lintProject = async (target: string, eslint: ESLint): Promise<ESLint.LintResult[]> => {
    const ruleStart = target ? `${target}/` : '';
    const rules = ['js', 'mjs', 'cjs'].map((ending) => `${ruleStart}**/*.${ending}`);
    return eslint.lintFiles(rules);
  };

  static validateResult = (results: ESLint.LintResult[]): boolean => results
    .reduce((errors, result) => errors + result.errorCount + result.fatalErrorCount, 0) === 0;

  static displayResults = async (results: ESLint.LintResult[], eslint: ESLint) => {
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);
    /* eslint no-console: "off" */
    console.log(resultText);
  };
}

export default EslintRunner;
