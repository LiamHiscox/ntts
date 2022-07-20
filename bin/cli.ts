#!/usr/bin/env node

import yargs, { Arguments } from 'yargs';
import main from "../lib";
import { OptionsModel } from "../lib/models/options.model";

yargs
    .scriptName('ntts')
    .command(
        'refactor',
        'refactor an existing Node.js application to support TypeScript',
        {
            'target': {
                alias: 't',
                type: 'string',
                describe: 'Provide the target folder to refactor the files in',
                default: '.',
            },
            'installation': {
                alias: 'i',
                type: 'boolean',
                describe: 'Skip the creation of a package.json (if none is present) and installation of dependencies (npm install)',
                default: false
            },
            'lint': {
                alias: 'l',
                type: 'boolean',
                describe: 'Skip the linting process performed with ES-Lint',
                default: false
            },
            'config': {
                alias: 'c',
                type: 'boolean',
                describe: 'Skip the addition of a tsconfig.json file and the configuration of TypeScript',
                default: false
            },
            'dependencies': {
                alias: 'd',
                type: 'boolean',
                describe: 'Skip the installation of additional dependencies such as TypeScript, TS-Node and type declarations',
                default: false
            },
            'rename': {
                alias: 'r',
                type: 'boolean',
                describe: 'Skip the renaming of JavaScript files to TypeScript files inside the target path',
                default: false
            },
            'scripts': {
                alias: 's',
                type: 'boolean',
                describe: 'Skip the refactoring of scripts inside the package.json file to use TS-Node and target TypeScript files',
                default: false
            }
        },
        async (options: Arguments<OptionsModel>) => main(options),
    )
    .argv;
