import yargs, {Arguments} from 'yargs';
import {lstatSync, readdirSync} from "fs";
import * as path from "path";

const base_path = 'node_modules';

console.log(readdirSync(base_path).map((path_string) => ({
    path: path.join(base_path, path_string),
    file: lstatSync(path.join(base_path, path_string)).isFile(),
    directory: lstatSync(path.join(base_path, path_string)).isDirectory()
})));

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
            console.log(options);
        })
    .argv;
