import yargs, {Arguments} from 'yargs';
import {FileRename} from "./file-rename/file-rename";
import {ScriptRunner} from "./script-runner/script-runner";
import {DependencyInstaller} from "./dependency-installer/dependency-installer";
import {TsconfigHandler} from "./tsconfig-handler/tsconfig-handler";
import {PackageJsonHandler} from "./package-json-handler/package-json-handler";
import {InputValidator} from "./input-validator/input-validator";

const basicSetup = () => {
  ScriptRunner.runInherit('npm install');
}

const renameFiles = (target: string) => {
  FileRename.rename(target);
}

const installDependencies = () => {
  DependencyInstaller.addPackageJson();
  DependencyInstaller.installBaseDependencies();
  DependencyInstaller.installTypeDependencies();
}

const addTsconfig = (target: string) => {
  TsconfigHandler.addConfig(target);
}

const addScripts = (target: string) => {
  const packageJson = PackageJsonHandler.readPackageJson();
  const scripts = PackageJsonHandler.addTsScripts(packageJson.scripts, target);
  PackageJsonHandler.writePackageJson({...packageJson, scripts});
}

const main = (target: string) => {
  const validTarget = InputValidator.validate(target);
  if (validTarget !== null) {
    basicSetup();
    renameFiles(validTarget);
    installDependencies();
    addTsconfig(validTarget);
    addScripts(validTarget);
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
