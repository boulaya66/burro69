import { cliApp } from 'js-build';

const cmdApp = {
    usage: 'app <src>',
    alias: ['a'],
    describe: 'Entry of the cli app.',
    options: [
        {
            flags: '--cwd',
            desc: 'Use an alternative working directory',
            value: '.'
        }
    ],
    categories: {
    },
    default: true,
    example: ['app'],
    middlewares: [
    ],
    action: cliApp
};

const cmdSub = {
    usage: 'app sub <src>',
    alias: ['s'],
    describe: 'Sub entry of the cli app.',
    options: [
        {
            flags: '-o, --output',
            desc: 'output file name',
            value: 'output.txt'
        }
    ],
    default: false,
    example: ['app sub file.txt'],
    action: cliApp
};

export { cmdApp, cmdSub };

//___EOF___
