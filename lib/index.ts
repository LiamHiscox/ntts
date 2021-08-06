import yargs, {Arguments} from 'yargs';
import {FileRename} from "./file-rename/file-rename";
import {ScriptRunner} from "./script-runner/script-runner";

// TODO: root and target should both be configurable

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
        },
        (options: Arguments<{ root: string }>) => {
            ScriptRunner.run('npm install', options.root);
            FileRename.renameFiles(options.root);
        })
    .argv;
