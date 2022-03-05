import yargs, { Arguments } from 'yargs';
import FileRename from './file-rename/file-rename';
import DependencyInstaller from './dependency-installer/dependency-installer';
import TsconfigHandler from './tsconfig-handler/tsconfig-handler';
import PackageJsonHandler from './package-json-handler/package-json-handler';
import InputValidator from './input-validator/input-validator';
import { PackageManager } from './models/package-manager';
import IgnoreConfigParser from './ignore-config-parser/ignore-config-parser';
import CodeRefactor from './code-refactor/code-refactor';
import EslintRunner from './eslint-runner/eslint-runner';

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

const main = async (target: string) => {
  const validTarget = InputValidator.validate(target);
  if (validTarget !== null) {
    const packageManager = DependencyInstaller.getPackageManager();
    await basicSetup(packageManager);
    const ignores = IgnoreConfigParser.getIgnores();
    if (await lintProject(validTarget, ignores)) {
      addTsconfig(validTarget, ignores);
      await installDependencies(packageManager);
      renameFiles(validTarget, ignores);
      renameScripts(validTarget);
      refactorJSCode(validTarget, ignores);
    }
  }
};

yargs
  .scriptName('ntts')
  .command(
    'refactor',
    'refactor an existing Node.js application to support TypeScript',
    {
      't': {
        alias: 'target',
        type: 'string',
        describe: 'Provide the target folder to refactor the files in',
        default: '.',
      }
    },
    async ({ t }: Arguments<{ t: string }>) => main(t),
  )
  .argv;
