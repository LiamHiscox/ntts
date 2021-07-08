import yargs, {Arguments} from 'yargs';

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
