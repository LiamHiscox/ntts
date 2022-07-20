import FileRename from './file-rename/file-rename';
import DependencyInstaller from './dependency-installer/dependency-installer';
import TsconfigHandler from './tsconfig-handler/tsconfig-handler';
import PackageJsonHandler from './package-json-handler/package-json-handler';
import InputValidator from './input-validator/input-validator';
import { PackageManager } from './models/package-manager';
import IgnoreConfigParser from './ignore-config-parser/ignore-config-parser';
import CodeRefactor from './code-refactor/code-refactor';
import EslintRunner from './eslint-runner/eslint-runner';
import { OptionsModel } from "./models/options.model";

const basicSetup = async (packageManager: PackageManager) => {
  DependencyInstaller.addPackageJson(packageManager);
  await DependencyInstaller.installProject(packageManager);
};

const lintProject = async (target: string, ignores: string[]): Promise<boolean> => {
  const eslint = await EslintRunner.getLinter(ignores);
  const result = await EslintRunner.lintProject(target, eslint);
  await EslintRunner.displayResults(result, eslint);
  return EslintRunner.validateResult(result);
};

const renameFiles = (target: string, ignores: string[]) => {
  FileRename.rename(target, ignores);
};

const installDependencies = async (packageManager: PackageManager) => {
  await DependencyInstaller.installBaseDependencies(packageManager);
  await DependencyInstaller.installTypeDependencies(packageManager);
};

const addTsconfig = (target: string, ignores: string[]) => {
  TsconfigHandler.addConfig(target, ignores);
};

const renameScripts = (target: string) => {
  PackageJsonHandler.refactorScripts(target);
};

const refactorJSCode = (target: string, ignores: string[]) => {
  const project = CodeRefactor.addSourceFiles(ignores, target);
  CodeRefactor.convertToTypescript(project, target);
  project.saveSync();
};

const main = async (options: OptionsModel) => {
  const validTarget = InputValidator.validate(options.target);
  if (validTarget !== null) {
    const packageManager = DependencyInstaller.getPackageManager();
    options.installation && await basicSetup(packageManager);
    const ignores = IgnoreConfigParser.getIgnores();
    if (!options.lint || await lintProject(validTarget, ignores)) {
      options.config && addTsconfig(validTarget, ignores);
      options.dependencies && await installDependencies(packageManager);
      options.rename && renameFiles(validTarget, ignores);
      options.scripts && renameScripts(validTarget);
      refactorJSCode(validTarget, ignores);
    }
  }
};

export default main;
