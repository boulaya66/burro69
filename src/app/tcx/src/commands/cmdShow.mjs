import {
    extractOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";
import { showTCX } from "../lib/index.mjs";


/**
 * memberof module:tcx
 * memberof tcx/commands
 * tcx app: commands/cmdShow.mjs
 */

/**
 * tcx ``show`` command (alias `v`)
 * 
 * Show information from tcx source file.
 * 
 * Usage: ```tcx show <src> [options]```
 * @alias cmdShow
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx show activity1.tcx
 * @see {@link actShow} for information on the handler.
 */
const cmdShow = {
    usage: 'show <src>',
    alias: ['v'],
    describe: 'Show information from tcx.',
    default: false,
    options: [],
    categories: {},
    example: [
        'show activity1.tcx'
    ],
    middlewares: [
        extractOption('src')
    ],
    action: actShow
};

export default cmdShow;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdShow} handler
 * @alias actShow
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `show` cli options.
 * @param {String} opts.src The source file to process.
 */
async function actShow(opts) {
    try {
        await showTCX(opts.src);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

