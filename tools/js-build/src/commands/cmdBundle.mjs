import fs from 'fs';
import {
    mergeObjects,
    toArray,
    strReplaceVars
} from '@burro69/helpers';
import {
    concatOption,
    extractSubOptions,
    loadConfigMiddleware
} from '@burro69/sadex';
import { bundle } from 'js-build';

/**
 * jsb app: commands/cmdbundle.mjs
 */

//#region Internal middleware implementation
/**
 * Sadex middleware: specific 'compress' option parsing for microbundle
 * @param {...*} args - The arguments to process
 * @return {...*} - The transformed arguments.
 * @private
 */
const compressMiddleware = (...args) => {
    const opts = args.slice(-1)[0];

    if (opts.compress !== null) {
        // Convert `--compress true/false/1/0` to booleans:
        if (typeof opts.compress !== 'boolean')
            opts.compress = opts.compress !== 'false' && opts.compress !== '0';

    } else {
        // the default compress value is `true` for web, `false` for Node:
        opts.compress = opts.target !== 'node';
    }
    return args;
};

/**
 * Sadex middleware: prepare bundles config to pass to microbundle fork
 * @param {...*} args - The arguments to process
 * @return {...*} - The transformed arguments.
 * @private
 */
const buildConfigs = (...args) => {
    function isDir(name) {
        try {
            const stats = fs.statSync(name);
            return stats.isDirectory();
        } catch (error) {
            //
        }
        return false;
    }

    // process inputs
    const options = args.slice(-1)[0];

    if (!options.configs)
        return args;

    const configs = options.configs;
    const bundles = [];

    // create bundle configs
    for (let config of configs) {
        config.format = toArray(config.format);

        for (let f of config.format) {
            const build = mergeObjects({}, config);
            if (build.entry)
                build.entries = toArray(build.entry);
            delete (build.entry);
            build.config = config.config;
            build.format = f;

            if (config.output) {
                const format = (config.formats ? config.formats[f] : f);
                build.output = strReplaceVars(config.output, {
                    name: config.name,
                    format,
                    config: config.config,
                    main: config.main.name,
                    dir: config.main.dir/*,
                    bin: ''*/
                });
            }

            if (build.output && !(isDir(build.output)))
                build['pkg-main'] = false;

            delete (build.formats);
            delete (build.main);

            bundles.push(build);
        }
    }

    // return args
    options.configs = bundles;
    return args;
};

//#endregion

// internal DEFAULT microbundle conf
const DEFAULT = {
    format: [],
    'pkg-main': true,
    target: 'node',
    compress: false,
    cwd: '.',
    sourcemap: false,
    'css-modules': null,
    raw: false
};

/**
 * Bundle command description
 */
const cmdBundle = {
    usage: 'bundle [entries...]',
    alias: ['b'],
    describe: 'Bundles specified entries or config (--config) with microbundle.\nIf config is specified, all other options are ignored unless forced.',
    default: false,
    options: [
        // removed ['--entry, -i', 'Entry module(s)'],
        ['--output, -o', 'Directory to place build files into'],
        ['--format, -f', `Only build specified formats (any of modern,es,cjs,umd or iife)`,
            'modern,es,cjs,umd'],
        // removed ['--watch, -w', 'Rebuilds on any change', false],
        ['--pkg-main', 'Outputs files analog to package.json main entries', true],
        ['--target', 'Specify your target environment (node or web)', 'web'],
        ['--external', `Specify external dependencies, or 'none'`],
        ['--globals', `Specify globals dependencies, or 'none'`],
        ['--define', 'Replace constants with hard-coded values'],
        ['--alias', `Map imports to different modules`],
        ['--compress', 'Compress output using Terser', null],
        ['--strict', 'Enforce undefined global context and add "use strict"'],
        ['--name', 'Specify name exposed in UMD builds'],
        ['--cwd', 'Use an alternative working directory', '.'],
        ['--sourcemap', 'Generate source map', true],
        ['--css-modules',
            'Turns on css-modules for all .css imports. Passing a string will override the scopeName. eg --css-modules="_[hash]"',
            null],
        ['--raw', 'Show raw byte size', false],
        ['--jsx', 'A custom JSX pragma like React.createElement (default: h)'],
        ['--tsconfig', 'Specify the path to a custom tsconfig.json'],
        ['--config', 'Configs to load from package.json'],
        ['--cfgfile', 'External config file (alternative to package.json), if `config` is set.'],
        ['--force', 'Force other options to be processed, if `config` is set.'],
        ['--dry-run', 'Show specified configs in detail, but do not run them', false]
    ],
    categories: {
        'Input': ['entries', 'pkg-main', 'name', 'cwd'],
        'Config': ['config', 'cfgfile', 'force', 'defaultConfig', 'forcedConfig', 'configs'],
        'Output': ['output', 'format', 'target', 'compress', 'sourcemap', 'raw'],
        'Bundle': ['external', 'globals', 'define', 'alias', 'strict', 'css-modules', 'jsx', 'tsconfig']
    },
    example: [
        'bundle --globals react=React,jquery=$',
        'bundle --define API_KEY=1234',
        'bundle --alias react=preact',
        'bundle --no-sourcemap # don\'t generate sourcemaps',
        'bundle --tsconfig tsconfig.build.json',
        'bundle --config lib --force sourcemap,compress,format=modern,format=cjs'
    ],
    middlewares: [
        concatOption('entries'),
        compressMiddleware,
        extractSubOptions('force'),
        loadConfigMiddleware('bundle', DEFAULT),
        buildConfigs
    ],
    action: bundle
};

export default cmdBundle;

//___EOF___
