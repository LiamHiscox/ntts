import yargs, {Arguments} from 'yargs';
import {FileRename} from "./file-rename/file-rename";
import {ScriptRunner} from "./script-runner/script-runner";

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
                    describe: 'Provide the target folder to refactor to TypeScript',
                    default: ''
                })
        },
        (options: Arguments<{ root: string, target: string }>) => {
            const targetFolder = options.target || options.root;
            ScriptRunner.run('npm install', { cwd: options.root });
            FileRename.renameFiles(targetFolder);
        })
    .argv;
