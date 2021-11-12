import yargs, {Arguments} from 'yargs';
import {FileRename} from "./file-rename/file-rename";
import {DependencyInstaller} from "./dependency-installer/dependency-installer";
import {TsconfigHandler} from "./tsconfig-handler/tsconfig-handler";
import {PackageJsonHandler} from "./package-json-handler/package-json-handler";
import {InputValidator} from "./input-validator/input-validator";
import {PackageManager} from "./models/package-manager";
import {IgnoreConfigParser} from "./ignore-config-parser/ignore-config-parser";
import {CodeRefactor} from "./code-refactor/code-refactor";
import {Project} from "ts-morph";

const basicSetup = (packageManager: PackageManager) => {
  DependencyInstaller.addPackageJson(packageManager);
  DependencyInstaller.installProject(packageManager);
}

const renameFiles = (target: string, ignores: string[]) => {
  FileRename.rename(target, ignores);
}

const installDependencies = (packageManager: PackageManager) => {
  DependencyInstaller.installBaseDependencies(packageManager);
  DependencyInstaller.installTypeDependencies(packageManager);
}

const addTsconfig = (target: string, ignores: string[]) => {
  TsconfigHandler.addConfig(target, ignores);
}

const renameScripts = (target: string) => {
  PackageJsonHandler.refactorScripts(target);
}

const refactorJSCode = (target: string, ignores: string[]) => {
  const project = CodeRefactor.addSourceFiles(new Project(), ignores, target);
  project.getSourceFiles().forEach(CodeRefactor.convertToTypescript);
}


const main = (target: string) => {
  const validTarget = InputValidator.validate(target);
  if (validTarget !== null) {
    const packageManager = DependencyInstaller.getPackageManager();
    basicSetup(packageManager);
    installDependencies(packageManager);
    const ignores = IgnoreConfigParser.getIgnores();
    renameFiles(validTarget, ignores);
    addTsconfig(validTarget, ignores);
    renameScripts(validTarget);
    refactorJSCode(validTarget, ignores);
  }
}

yargs
  .scriptName('ntts')
  .command(
    'refactor',
    'refactor an existing Node.js application to support TypeScript',
    (yargs) => {
      yargs
        .option('t', {
          alias: 'target',
          type: 'string',
          describe: 'Provide the target folder to refactor the files in',
          default: '.'
        })
    },
    ({target}: Arguments<{ target: string }>) => main(target))
  .argv;
