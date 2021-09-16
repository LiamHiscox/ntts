import yargs, {Arguments} from 'yargs';
import {FileRename} from "./file-rename/file-rename";
import {ScriptRunner} from "./script-runner/script-runner";
import {DependencyInstaller} from "./dependency-installer/dependency-installer";

const main = (target: string) => {
  ScriptRunner.runInherit('npm install');
  FileRename.rename(target);
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
                .option('t', {
                    alias: 'target',
                    type: 'string',
                    describe: 'Provide the target folder to refactor the files in',
                    default: '.'
                })
        },
        ({target}: Arguments<{ target: string }>) => main(target))
    .argv;
