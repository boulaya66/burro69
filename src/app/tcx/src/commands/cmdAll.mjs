//#region imports
/**
 * Node.js builtin module: path
 * @external path
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/path.html|node.js path documentation}
 */
import path from 'path';

/**
 * Node.js builtin module: fs/promises
 * @external fs/promises
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/fs.html#fs_fs_promises_api|node.js fs/promises documentation}
 */
import { writeFile, readdir } from 'fs/promises';
import {
    extractOption,
    arrayifyOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";
import { getMetrics } from "../lib/index.mjs";
//#endregion

/**
 * memberof module:tcx
 * memberof tcx/commands
 * file tcx app: commands/cmdAll.mjs
 */

/**
 * tcx 'all' command description (alias a)
 * 
 * Get metrics from src/*.tcx (power metrics based on <FTP>).
 *
 * Usage: ```tcx all <src> <FTP> [options]```
 * @alias cmdAllMetrics
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx all ./data 216 -s 25
 * @see {@link actAllMetrics} for information on the handler.
 */
const cmdAllMetrics = {
    usage: 'all <src> <FTP>',
    alias: ['a'],
    describe: 'Get metrics from src/*.tcx (power metrics based on <FTP>).',
    default: false,
    options: [
        ['-s, --smoothing', 'Smoothing factor', 25],
        ['-m, --metrics', 'Select metrics (comma separated or all).', 'main'],
        ['-o, --output', 'Change the path and name of the output file', './metrics.txt']
    ],
    categories: {},
    example: [
        'all ./data 216 -s 25'
    ],
    middlewares: [
        extractOption('src'),
        extractOption('FTP'),
        arrayifyOption('metrics')
    ],
    action: actAllMetrics
};

export default cmdAllMetrics;

/**
 * Internal commands implementation
 */
/**
 * The {@link cmdAllMetrics} handler
 * @alias actAllMetrics
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `all` cli options.
 * @param {String} opts.src Directory where to scan tcx files.
 * @param {Number} opts.FTP The FTP of the user in order to calculate power based metrics.
 * @param {Number} [opts.smoothing=25] Smoothing factor.
 * @param {...String} [opts.metrics='main'] Select metrics (comma separated or all).
 * @param {String} [opts.output='./metrics.txt'] Change the path and name of the output file.
 */
async function actAllMetrics(opts) {
    try {
        let metrics = opts.metrics;
        let content = '';
        let first = true;
        let files = await readdir(opts.src, { withFileTypes: true });
        for (let i = 0; i < files.length; i++) {
            let f = files[i];
            if (f.isFile())
                log.info(`Analyzing ${f.name}...`);
            else
                continue;

            let res = await getMetrics(path.join(opts.src, f.name), opts.FTP, opts.smoothing);
            if (res) {
                if (metrics.indexOf('all') >= 0)
                    metrics = Object.keys(res);
                res = metrics.reduce((acc, key) => ({ ...acc, ...res[key] }), {});
                if (first) {
                    content += ['FileName'].concat(Object.keys(res)).join(';') + '\n';
                    first = false;
                }
                content += [f.name].concat(Object.values(res)).join(';') + '\n';
            }
        }
        await writeFile(opts.output, content);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

