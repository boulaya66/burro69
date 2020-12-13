import {
    concatOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";
import { combineTCX } from "../lib/index.mjs";

/**
 * memberof module:tcx
 * memberof tcx/commands
 * file tcx app: commands/cmdCombine.mjs
 */

/**
 * tcx ``combine`` command (alias ``c``)
 * 
 * Combine tcx files in one single multi-lap activity.
 *
 * Usage: ```tcx combine <src...> [options]```
 * @alias cmdCombine
 * @memberof module:tcx/commands
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx combine activity1.tcx activity2.tcx --output activity.tcx
 * @see {@link actCombine} for information on the handler.
 */
const cmdCombine = {
    usage: 'combine <src...>',
    alias: ['c'],
    describe: 'Combine tcx files in one single multi-lap activity',
    default: false,
    options: [
        ['--output, -o', 'Change the name of the output file', 'result.tcx']
    ],
    categories: {},
    example: [
        'combine activity1.tcx activity2.tcx --output activity.tcx'
    ],
    middlewares: [
        concatOption('src')
    ],
    action: actCombine
};

export default cmdCombine;

/**
 * Internal commands implementation
 */
/**
 * The {@link cmdCombine} handler
 * @alias actCombine
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `combine` cli options.
 * @param {...String} opts.src Source files to combine.
 * @param {String} [opts.output='./result.txt'] Change the path and name of the output file.
 */
async function actCombine(opts) {
    try {
        await combineTCX(opts.src, opts.output);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

