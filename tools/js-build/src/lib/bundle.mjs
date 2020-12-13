import { resolve, basename, relative } from 'path';
import { log } from '@burro69/logger';
import dynamicImport from './dynamic.mjs';

/**
 * jsb app: lib/bundle.mjs
 */

/**
 * Internal wrapper for @fork/microbundle
 * @param {object} opts - The options to pass to microbundle fork
 * @return {void}
 * @private
 */
async function microbundle(opts) {
    try {
        let _microbundle = await dynamicImport('@fork/microbundle');
        const { output } = await _microbundle(opts);
        // eslint-disable-next-line eqeqeq
        if (output != null)
            log(output);
    } catch (error) {
        log.error(error);
    }
}

/**
 * Launch internal microbundle wrapper with the provided options
 * @param {object} opts - The options to pass to microbundle fork
 * @return {void}
 */
export async function bundle(opts) {
    log.info(`${opts.prog.bin} v${opts.prog.ver} - bundle`);
    const cwd = resolve(process.cwd(), opts.cwd || '.');
    const dryRun = opts['dry-run'];

    if (!opts.configs)
        opts.configs = [{ ...opts }];

    if (dryRun) {
        opts.forcedConfig = opts.forcedConfig || {};
        opts.defaultConfig = opts.defaultConfig || {};
        const forcedKeys = Object.keys(opts.forcedConfig);
        const defaultKeys = Object.keys(opts.defaultConfig || {}).filter(key => (key !== 'dry-run' && key !== 'force'));

        if (defaultKeys.length) {
            log.success((`\nBundle dry-run: common options`));
            for (let key of defaultKeys)
                log(`  ${key}: ${JSON.stringify(opts.defaultConfig[key])}`);
        }

        if (forcedKeys.length) {
            log.warn((`\nBundle dry-run: forced options`));
            for (let key of forcedKeys)
                log(`  ${key}: ${JSON.stringify(opts.forcedConfig[key])}`);
        }

        for (let build of opts.configs) {
            log.info((`\nShould bundle ${build.config || 'default'}.${build.format} "${build.name || basename(cwd)}" to ${relative(cwd, build.output || '.') || 'dist'}:`));
            for (let key in build) {
                if (key !== 'config' && key !== 'prog' && build[key] !== opts.defaultConfig[key] && !(forcedKeys.includes(key)))
                    log(`  ${key}: ${JSON.stringify(build[key])}`);
            }
        }

        return;
    }

    for (let build of opts.configs) {
        log.info((`\nBundle ${build.config || 'default'}.${build.format} "${build.name || basename(cwd)}" to ${relative(cwd, build.output || '.') || 'dist'}:`));
        await microbundle(build);
    }
}

//___EOF___
