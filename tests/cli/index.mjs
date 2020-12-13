//'use strict';

import { toArray, mergeObjects, getPackageJson, getPackageJsonKeys } from '@burro69/helpers';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pkg = getPackageJson(__dirname);

console.log(kleur.cyan(`${pkg.name} v${pkg.version} running from ${import.meta.url} in ${process.cwd()}`));

/**
 * microbundle internals
 */
//#region microbundle internals
import camelCase from 'camelcase';
import kleur from 'kleur';

export const stdout = console.log.bind(console);
export const stderr = console.error.bind(console);
function logError(err) {
    const error = err.error || err;
    const description = `${error.name ? error.name + ': ' : ''}${error.message ||
        error}`;
    const message = error.plugin
        ? `(${error.plugin} plugin) ${description}`
        : description;

    stderr((message));

    if (error.loc) {
        stderr();
        stderr(`at ${error.loc.file}:${error.loc.line}:${error.loc.column}`);
    }

    if (error.frame) {
        stderr();
        stderr((error.frame));
    } else if (err.stack) {
        const headlessStack = error.stack.replace(message, '');
        stderr((headlessStack));
    }

    stderr();
}
function isDir(name) {
    return fs.stat(name)
        .then(stats => stats.isDirectory())
        .catch(() => false);
}
export function getName({ name, pkgName, amdName, cwd, hasPackageJson }) {
    if (!pkgName) {
        pkgName = basename(cwd);
        if (hasPackageJson) {
            stderr(
                inverse('WARN'),
                (` missing package.json "name" field. Assuming "${pkgName}".`),
            );
        }
    }

    const finalName = name || amdName || safeVariableName(pkgName);

    return { finalName, pkgName };
}
export const removeScope = name => name.replace(/^@.*\//, '');
const INVALID_ES3_IDENT = /((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g;
export function safeVariableName(name) {
    const normalized = removeScope(name).toLowerCase();
    const identifier = normalized.replace(INVALID_ES3_IDENT, '');
    return camelCase(identifier);
}
//#endregion

const DEFAULT = {
    format: [],
    '--pkg-main': false,
    target: 'node',
    compress: false,
    cwd: '.',
    sourcemap: false,
    'css-modules': null,
    raw: false
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function buildConfig(opts = { _: [], cwd: '.' }) {

    // process inputs
    const configs = opts.configs;//toArray(config).concat(opts._);
    const cwd = path.resolve(process.cwd(), opts.cwd)

    // read configs
    const pkg = getPackageJsonKeys(['bundle', 'main', 'name', 'amdName'], cwd);
    if (!pkg.bundle)
        throw new Error('package.json does not contain any bundle config.');
    const main = pkg.main ? path.parse(pkg.main) : { dir: '', name: '', ext: '' };
    const bundle = pkg.bundle;

    // initialize 
    bundle.default = mergeObjects(DEFAULT, bundle.default || {});
    const { finalName } = getName({
        name: bundle.default.name,
        pkgName: pkg.name,
        amdName: pkg.amdName,
        hasPackageJson: true,
        cwd,
    });
    bundle.default.name = finalName;
    const builds = [];

    // process each build config
    //configs.forEach(config => {
    for (let config of configs) {
        if (!bundle[config])
            throw new Error(`package.json does not contain any ${config} config.`);
        const options = mergeObjects(bundle.default, bundle[config]);
        options.format = toArray(options.format);
        //options.format.forEach(async (f) => {
        for (let f of options.format) {
            const build = mergeObjects({}, options);
            build.config = config;
            build.format = f;

            if (options.output) {
                const format = (options.formats ? options.formats[f] : f);
                build.output = options.output
                    .replace('$0', main.dir)
                    .replace('$1', main.name)
                    .replace('$2', main.ext)
                    .replace('$3', format)
                    .replaceAll('..', '.');
            }

            if (build.output && !(await isDir(build.output)))
                build['pkg-main'] = false;

            builds.push(build);
        }//);

    }//);

    async function microbundle(inputOptions) {
        const targetDir = path.relative(cwd, path.dirname(inputOptions.output)) || '.';
        const banner = kleur.blue(`Build "${inputOptions.name}" to ${targetDir}:`);
        return {
            output: `${banner}\n   ${JSON.stringify(inputOptions, null, 2)}\n`,
        };
    }

    //builds.forEach(build => {
    for (let build of builds) {
        stdout(kleur.cyan(`Build[${build.config}.${build.format}] "${build.name}" to ${path.relative(cwd, build.output)}:`));
        if (build['dry-run']) {
            const targetDir = path.relative(cwd, path.dirname(inputOptions.output)) || '.';
            const banner = kleur.blue(`Build "${inputOptions.name}" to ${targetDir}:`);
            stdout(`${banner}\n   ${JSON.stringify(inputOptions, null, 2)}\n`);
        } else
            await microbundle(build)
                .then(({ output }) => {
                    if (output != null) stdout(output);
                    //if (!opts.watch) process.exit(0);
                })
                .catch(err => {
                    //process.exitCode = (typeof err.code === 'number' && err.code) || 1;
                    logError(err);
                    //process.exit();
                });
    }//);

    // returns back results
    return { };
};

import sade from 'sade';

const createProg = (handler) => {
    const cmd = (str, opts) => {
        opts.configs = toArray(str||'default').concat(opts._);
        buildConfig(opts)
            .then(({ output }) => {
                if (output != null) stdout(output);
            })
            .catch(err => {
                process.exitCode = (typeof err.code === 'number' && err.code) || 1;
                logError(err);
                process.exit();
            });
    }

    let prog = sade('microbundle');

    prog
        .version(pkg.version)
        .option('--cwd', 'Use an alternative working directory', '.')
        .option('--dry-run', 'Show specified configs in detail, but do not run them', false)
        .command('bundle [..config]')
        .describe('Builds specified configs (or default config if none).')
        .example('bundle prod')
        .action(cmd);

    return argv =>
        prog.parse(argv, {
            alias: {
                o: ['output', 'd'],
                i: ['entry', 'entries', 'e'],
                w: ['watch'],
            },
        });
}

const run = opts => { }

createProg(run)(process.argv);