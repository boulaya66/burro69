import {
    concatOption,
    arrayifyOption
} from '@burro69/sadex';
import { extractSubOptions } from './middlewares.mjs';
import { bundleConfig } from 'js-build';

const cmdBundleConfig = {
    usage: 'bundle config [config...]',
    alias: ['g'],
    describe: 'Bundles specified configs (or default config if none).\nAll other options are ignored unless forced.',
    default: false,
    options: [
        {
            flags: '--dry-run',
            desc: 'Show specified configs in detail, but do not run them',
            value: false
        },
        {
            flags: '--force',
            desc: 'Force other options to be processed.',
            value: ''
        },
        {
            flags: '--cwd',
            desc: 'Use an alternative working directory',
            value: '.'
        }
    ],
    example: ['bundle default --force sourcemap,compress'],
    middlewares: [
        concatOption('config'),
        arrayifyOption('force'),
        extractSubOptions('force')
    ],
    action: bundleConfig
};

export default cmdBundleConfig;

//___EOF___
