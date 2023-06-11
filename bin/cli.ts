#!/usr/bin/env node

import yargs, {Arguments} from 'yargs';
import main from '../lib/index.js';
import {OptionsModel} from '../lib/models/options.model.js';

yargs
  .scriptName('ntts')
  .command(
    'refactor',
    'refactor an existing Node.js application to support TypeScript',
    {
      'target': {
        alias: 't',
        string: true,
        describe: 'Provide the target folder to refactor the files in',
        default: '.',
      },
      'unknown': {
        alias: 'u',
        boolean: true,
        describe: 'Use the type unknown instead of any to explicitly type untyped values',
        default: false
      },
      'installation': {
        alias: 'i',
        boolean: true,
        describe: 'Skip the creation of a package.json (if none is present) and installation of dependencies (npm install)',
        default: false
      },
      'lint': {
        alias: 'l',
        boolean: true,
        describe: 'Skip the linting process performed with ES-Lint',
        default: false
      },
      'config': {
        alias: 'c',
        boolean: true,
        describe: 'Skip the addition of a tsconfig.json file and the configuration of TypeScript',
        default: false
      },
      'dependencies': {
        alias: 'd',
        boolean: true,
        describe: 'Skip the installation of additional dependencies such as TypeScript, TS-Node and type declarations',
        default: false
      },
      'rename': {
        alias: 'r',
        boolean: true,
        describe: 'Skip the renaming of JavaScript files to TypeScript files inside the target path',
        default: false
      },
      'scripts': {
        alias: 's',
        boolean: true,
        describe: 'Skip the refactoring of scripts inside the package.json file to use TS-Node and target TypeScript files',
        default: false
      }
    },
    async (options: Arguments<OptionsModel>) => main(options),
  )
  .argv;

yargs.parse();
