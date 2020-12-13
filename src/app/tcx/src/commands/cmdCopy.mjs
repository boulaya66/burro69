import {
    extractOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";
import { copyTCX } from "../lib/index.mjs";


/**
 * memberof module:tcx
 * memberof tcx/commands
 * file tcx app: commands/cmdCopy.mjs
 */

/**
 * tcx ``copy`` command (alias cp)
 * 
 * Copy tcx file.
 * 
 * Usage: ```tcx copy <src> <dst>```
 * @alias cmdCopy
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx copy activity.tcx activity1.tcx
 * @see {@link actCopy} for information on the handler.
 */
const cmdCopy = {
    usage: 'copy <src> <dst>',
    alias: ['cp'],
    describe: 'Copy tcx file.',
    default: false,
    options: [],
    categories: {},
    example: [
        'copy activity.tcx activity1.tcx'
    ],
    middlewares: [
        extractOption('src'),
        extractOption('dst')
    ],
    action: actCopy
};

export default cmdCopy;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdCopy} handler
 * @alias actCopy
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `copy` cli options.
 * @param {String} opts.src Source file to copy from.
 * @param {String} opts.dst Destination file to copy to..
 */
async function actCopy(opts) {
    try {
        await copyTCX(opts.src, opts.dst);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

