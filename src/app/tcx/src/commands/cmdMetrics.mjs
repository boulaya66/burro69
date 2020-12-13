//#region imports
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
 * file tcx app: commands/cmdMetrics.mjs
 */

/**
 * tcx ``metrics`` command (alias `x`)
 * 
 * Get metrics from src (power metrics based on <FTP>).
 * 
 * Usage: ```tcx metrics <src> <FTP> [options]```
 * @alias cmdMetrics
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx metrics activity1.tcx 216 -s 30
 * @see {@link actMetrics} for information on the handler.
*/
const cmdMetrics = {
    usage: 'metrics <src> <FTP>',
    alias: ['x'],
    describe: 'Get metrics from <src> (power metrics based on <FTP>).',
    default: false,
    options: [
        ['-s, --smoothing', 'Smoothing factor', 25],
        ['-m, --metrics', 'Select metrics (comma separated or all).', 'all']
    ],
    categories: {},
    example: [
        'metrics activity1.tcx 216 -s 30'
    ],
    middlewares: [
        extractOption('src'),
        extractOption('FTP'),
        arrayifyOption('metrics')
    ],
    action: actMetrics
};

export default cmdMetrics;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdMetrics} handler
 * @alias actMetrics
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `metrics` cli options.
 * @param {String} opts.src The source file to process.
 * @param {Number} opts.FTP The FTP of the user in order to calculate power based metrics.
 * @param {Number} [opts.smoothing=25] Smoothing factor.
 * @param {...String} [opts.metrics='all'] Select metrics (comma separated or all).
 */
async function actMetrics(opts) {
    try {
        let res = await getMetrics(opts.src, opts.FTP, opts.smoothing);
        if (opts.metrics.indexOf('all') < 0) {
            res = opts.metrics.reduce((acc, key) => {
                acc[key] = res[key];
                return acc;
            }, {});
        }
        log(res);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

