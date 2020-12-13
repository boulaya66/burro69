import { resolve, relative } from 'path';
import { shallowEqual } from "@burro69/helpers";
import { log } from '@burro69/logger';
import dynamicImport from './dynamic.mjs';

/**
 * jsb app: lib/build.mjs
 */

/**
 * Internal wrapper for nexe
 * @param {object} opts - The options to pass to nexe
 * @return {void}
 * @private
 */
async function nexe(opts) {
    try {
        let compile = await dynamicImport('nexe', 'compile');
        await compile(opts);
    } catch (error) {
        log.error(error);
    }
}

/**
 * TODO: import nexe
 * @param opts 
 */
export async function build(opts) {
    log.info(`${opts.prog.bin} v${opts.prog.ver} - build`);
    const cwd = resolve(process.cwd(), opts.cwd);
    opts.cwd = cwd;
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
            log.info((`\nShould build ${build.config || 'default'}.${build.target} ${build.name ? `"${build.name}"` : ''}  to ${relative(opts.cwd, build.output || '.') || 'dist'}:`));
            for (let key in build) {
                if (key !== 'config' && key !== 'prog' && !shallowEqual(build[key], opts.defaultConfig[key]) && !(forcedKeys.includes(key)))
                    log(`  ${key}: ${JSON.stringify(build[key])}`);
            }
        }

        return;
    }

    for (let build of opts.configs) {
        log.info((`\nBuild ${build.target} ${build.name ? `"${build.name}"` : ''} to ${relative(opts.cwd, build.output || 'dist')}:`));
        await nexe(build);
    }
}


//___EOF___
