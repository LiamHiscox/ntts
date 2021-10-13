import yargs, {Arguments} from 'yargs';
import {FileRename} from "./file-rename/file-rename";
import {DependencyInstaller} from "./dependency-installer/dependency-installer";
import {TsconfigHandler} from "./tsconfig-handler/tsconfig-handler";
import {PackageJsonHandler} from "./package-json-handler/package-json-handler";
import {InputValidator} from "./input-validator/input-validator";
import {PackageManager} from "./models/package-manager";
import {IgnoreConfigParser} from "./file-rename/ignore-config-parser/ignore-config-parser";
import {CodeRefactor} from "./code-refactor/code-refactor";
import {Project} from "ts-morph";
import {join} from "path";

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

const addTsconfig = (target: string) => {
  TsconfigHandler.addConfig(target);
}

const addScripts = (target: string) => {
  PackageJsonHandler.refactorScripts(target);
}

const refactorJSCode = (ignores: string[], target: string) => {
  const project = CodeRefactor.addSourceFiles(new Project(), ignores, target);
  project.getSourceFiles().forEach(file => {
    console.log(join(file.getFilePath(), file.getBaseName()));
  })
}


const main = (target: string) => {
  const validTarget = InputValidator.validate(target);
  if (validTarget !== null) {
    if (false) {
      const packageManager = DependencyInstaller.getPackageManager();
      basicSetup(packageManager);
      installDependencies(packageManager);
      const ignores = IgnoreConfigParser.getIgnores();
      renameFiles(validTarget!, ignores);
      addTsconfig(validTarget!);
      addScripts(validTarget!);
    }
    const ignores = IgnoreConfigParser.getIgnores();
    refactorJSCode(ignores, validTarget);
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
