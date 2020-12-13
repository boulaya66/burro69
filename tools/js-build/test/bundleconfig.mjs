import { resolve, relative, parse, basename } from 'path';
import fs from 'fs/promises';
import { log } from '@burro69/logger';
import { mergeObjects, getPackageJsonKeys, toArray } from '@burro69/helpers';
import microbundle from './microbundle.mjs';

/**
 * jsb app: lib/bundleconfig.mjs
 */

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

//#region copy from microbundle
function isDir(name) {
    return fs.stat(name)
        .then(stats => stats.isDirectory())
        .catch(() => false);
}
const removeScope = name => name.replace(/^@.*\//, '');
const INVALID_ES3_IDENT = /((^[^a-zA-Z]+)|[^\w.-])|([^a-zA-Z0-9]+$)/g;
function safeVariableName(name) {
    const normalized = removeScope(name).toLowerCase();
    const identifier = normalized.replace(INVALID_ES3_IDENT, '');
    return (identifier);
}
function getName({ name, pkgName, amdName, cwd, hasPackageJson }) {
    if (!pkgName) {
        pkgName = basename(cwd);
        if (hasPackageJson)
            log.warn('WARN'` missing package.json "name" field. Assuming "${pkgName}".`);
    }

    const finalName = name || amdName || safeVariableName(pkgName);

    return { finalName, pkgName };
}
//#endregion

/**
 * Load bundle configuration from package.json (an inherited packages), create bundle configurations<br>
 * and launch internal microbundle wrapper with these configs.
 * @param {object} opts - The options to pass to microbundle fork
 * @return {void}
 */
export async function bundleConfig(opts) {

    // process inputs
    const configs = opts.config.length ? opts.config : ['default'];
    const cwd = resolve(process.cwd(), opts.cwd);

    // read configs
    const pkg = getPackageJsonKeys(['bundle', 'main', 'name', 'amdName'], cwd);
    if (!pkg.bundle)
        throw new Error('package.json does not contain any bundle config.');
    const main = pkg.main ? parse(pkg.main) : { dir: '', name: '', ext: '' };
    const bundle = pkg.bundle;

    // initialize 
    bundle.default = mergeObjects(DEFAULT, bundle.default || {});
    bundle.default['dry-run'] = opts['dry-run'];
    const { finalName } = getName({
        name: bundle.default.name,
        pkgName: pkg.name,
        amdName: pkg.amdName,
        hasPackageJson: true,
        cwd,
    });
    bundle.default.name = finalName;
    bundle.default.force = opts.force || {};
    const builds = [];

    // process each build config
    //configs.forEach(config => {
    for (let config of configs) {
        if (!bundle[config])
            throw new Error(`package.json does not contain any ${config} config.`);
        const options = mergeObjects(bundle.default, bundle[config], bundle.default.force);
        options.format = toArray(options.format);

        //options.format.forEach(async (f) => {
        for (let f of options.format) {
            const build = mergeObjects({}, options);
            if (build.entry)
                build.entries = toArray(build.entry);
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

            delete (build.formats);
            delete (build.force);

            builds.push(build);
        }//);

    }//);


    //builds.forEach(build => {
    if (bundle.default['dry-run']) {
        const forcedKeys = Object.keys(bundle.default.force);
        const defaultKeys = Object.keys(bundle.default).filter(key => (key !== 'dry-run' && key !== 'force'));

        log.success((`\nBundle dry-run: common options`));
        for (let key of defaultKeys)
            log(`  ${key}: ${JSON.stringify(bundle.default[key])}`);

        log.warn((`\nBundle dry-run: forced options`));
        for (let key of forcedKeys)
            log(`  ${key}: ${JSON.stringify(bundle.default.force[key])}`);

        for (let build of builds) {
            log.info((`\nBundle ${build.config}.${build.format} "${build.name}" to ${relative(cwd, build.output)}:`));
            for (let key in build) {
                if (build[key] !== bundle.default[key] && !(forcedKeys.includes(key)) && key !== 'config')
                    log(`  ${key}: ${JSON.stringify(build[key])}`);
            }
        }
    } else {
        for (let build of builds) {
            log.info((`\nBundle ${build.config}.${build.format} "${build.name}" to ${relative(cwd, build.output)}:`));
            log();
            await microbundle(build);
        }
    }//);

    // returns back results
    return {};
}

//___EOF___
