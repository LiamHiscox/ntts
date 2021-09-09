import yargs, {Arguments} from 'yargs';
import {FileRename} from "./file-rename/file-rename";
import {ScriptRunner} from "./script-runner/script-runner";
import {DependencyInstaller} from "./dependency-installer/dependency-installer";

const main = (root: string, target: string) => {
  process.chdir(root);
  ScriptRunner.runInherit('npm install');
  FileRename.renameFiles(target);
  DependencyInstaller.installBaseDependencies();
  DependencyInstaller.installTypeDependencies();
}

yargs
    .scriptName('nodejs2ts')
    .command(
        'refactor',
        'refactor an existing Node.js application to support TypeScript',
        (yargs) => {
            yargs
                .option('r', {
                    alias: 'root',
                    describe: 'Provide the root folder of the project',
                    type: 'string',
                    default: '.'
                })
                .option('t', {
                    alias: 'target',
                    type: 'string',
                    describe: 'Provide the target folder to refactor within the root folder',
                    default: '.'
                })
        },
        ({root, target}: Arguments<{ root: string, target: string }>) => main(root, target))
    .argv;
