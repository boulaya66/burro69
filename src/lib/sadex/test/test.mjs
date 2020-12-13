import { arrayifyOption, concatOption, sadex } from '../src/index.mjs';

const handler = (...args) => {
    args.forEach(arg => console.dir(arg));
};

const prog = sadex('', false);//new Sadex('cli-2', false);

const cmd = {
    usage: 'show <src>',
    alias: ['s'],
    describe: 'Show <src> file.',
    default: true,
    example: ['show file1', 'show file2 --json'],
    options: [
        {
            flags: '-o, --output',
            desc: 'Output filename',
            value: 'result.txt'
        },
        [
            '-f, --format',
            'File format',
            'json'
        ]
    ],
    middlewares: [concatOption('src'), arrayifyOption('format')],
    action: handler,
    // TODO required => inquirer !
};

prog
//.version('1.0.0')

    .command('combine <first> <src...>', '', { alias: ['c'] })
    .describe('Combine tcx files in one single multi-lap activity')
    .option('-o, --output', 'Change the name of the output file', 'result.tcx')
    .example('combine activity1.tcx activity2.tcx --output activity.tcx')
    .extractOption('first')
    .concatOption('src')
    .arrayifyOption('o')
    .action(handler)

    .command('build [packages...]')
    .alias(['b'])
    .describe('Build packages with microbundle.')
    .option('--all', 'Builds all workspaces.', false)
    .option('--recursive, -r', 'Also builds local dependencies.', false)
    .option('--cascade, -c', 'Also builds local dependent workspaces.', false)
    .option('--minify, -m', 'Minify resulting builds.', false)
    .option('--sourcemap, -s', 'Generates sourcemaps of resulting builds.', false)
    .option('--format, -f', 'Select outputs formats.', 'modern,es,cjs')
    .concatOption('packages')
    .arrayifyOption('format')
    .action()
    .step((context) => console.dir(context), 'step 1')
    .step((context) => context.skip(), 'step 2')
    .step(handler, 'step 3')
    .step((context, ...args) => {
        console.dir(args);
        args[0].prog.cli('combine toto titi tata -o tutu');
    }, 'step 4')

    .command(cmd)

    .parse(process.argv);

