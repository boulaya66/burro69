import path from 'path';
import fs from 'fs';
import util from 'util';
import childProcess from 'child_process';
import { log } from '@burro69/logger';

/**
 * jsb app: lib/bundle.mjs
 */

/**
 * Internal wrapper for jsdoc
 * @param {String} cmd jsdoc bin path
 * @param {String} cwd The working directory
 * @param {Array<String>} args The args to pass to jsdoc
 * @returns {void}
 * @private
 */
 const execJsDoc = async (cmd, cwd, ...args) => {
    const command = `${cmd} ${args.join(' ')}`;
    log.warn('run ' + command);
    const exec = util.promisify(childProcess.exec);
    const { stdout, stderr } = await exec(command, { cwd: cwd, stdio: 'inherit', shell: true });
    if (stderr)
        log.error(`${stderr}`);
    if (stdout)
        log(`${stdout}`);
};

/**
 * Launch jsdoc wrapper with the provided options
 * @param {object} opts - The options to pass to microbundle fork
 * @return {void} 
 */
export async function document(opts) {
    log.info(`${opts.prog.bin} v${opts.prog.ver} - bundle`);
    const cwd = path.resolve(process.cwd(), opts.cwd || '.');
    const dryRun = opts['dry-run'];

    if (!opts.configs)
        opts.configs = [{ ...opts }];

    if (dryRun) {
        opts.forcedConfig = opts.forcedConfig || {};
        opts.defaultConfig = opts.defaultConfig || {};
        const forcedKeys = Object.keys(opts.forcedConfig);
        const defaultKeys = Object.keys(opts.defaultConfig || {}).filter(key => (key !== 'dry-run' && key !== 'force'));

        if (defaultKeys.length) {
            log.success((`\jsDoc dry-run: common options`));
            for (let key of defaultKeys)
                log(`  ${key}: ${JSON.stringify(opts.defaultConfig[key], null, 2)}`);
        }

        if (forcedKeys.length) {
            log.warn((`\jsDoc dry-run: forced options`));
            for (let key of forcedKeys)
                log(`  ${key}: ${JSON.stringify(opts.forcedConfig[key], null, 2)}`);
        }

        for (let build of opts.configs) {
            log.info((`\nShould jsdoc ${build.config || 'default'} "${build.templates?.systemName || path.basename(cwd)}" to ${path.relative(cwd, build.opts?.destination || '.') || 'doc'}:`));
            for (let key in build) {
                if (key !== 'config' && key !== 'prog' && build[key] !== opts.defaultConfig[key] && !(forcedKeys.includes(key)))
                    log(`  ${key}: ${JSON.stringify(build[key], null, 2)}`);
            }
        }

        return;
    }

    const tmpPath = path.resolve(cwd, 'tmp.json');
    for (let build of opts.configs) {
        log.info((`\njsDoc ${build.config || 'default'} "${build.templates?.systemName || path.basename(cwd)}" to ${path.relative(cwd, build.opts?.destination || '.') || 'doc'}:`));
        await fs.promises.writeFile(
            tmpPath,
            JSON.stringify(build, null, 2),
            {
                encoding: 'utf8'
            });

        await execJsDoc(path.resolve(opts.docVars.root, 'node_modules/.bin/jsdoc'), cwd, '-c', tmpPath);
    }
    await fs.promises.rm(tmpPath);
}

//___EOF___
