/**
 * Node.js builtin module: path
 * @external path
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/path.html|node.js path documentation}
 */
import path from 'path';
import {
    extractOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";
import { splitTCX } from "../lib/index.mjs";


/**
 * memberof module:tcx
 * memberof tcx/commands
 * tcx app: commands/cmdSplit.mjs
 */

/**
 * tcx ``split`` command (alias s)
 * 
 * Split tcx file at offset (by default distance in meters).Resulting in two new files.
 * 
 * Usage: ```tcx split <src> <offset> [options]```
 * @alias cmdSplit
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx split activity1.tcx 25000
 * @see {@link actSplit} for information on the handler.
 */
const cmdSplit = {
    usage: 'split <src> <offset>',
    alias: ['s'],
    describe: 'Split tcx file at offset (by default distance in meters).Resulting in two new files.',
    default: false,
    options: [
        ['--output, -o', 'Change the path and name of the output files.', './result.tcx'],
        ['--time, -t', 'Offset is a time offset (in seconds) instead of a distance.', false]
    ],
    categories: {},
    example: [
        'split activity1.tcx 25000'
    ],
    middlewares: [
        extractOption('src'),
        extractOption('offset')
    ],
    action: actSplit
};

export default cmdSplit;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdSplit} handler
 * @alias actSplit
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `split` cli options.
 * @param {String} opts.src Source file to split.
 * @param {String} opts.offset The offset of the trackpoint where to split the lap.
 * @param {Boolean} [opts.time=false] Offset is a time offset (in seconds) instead of a distance..
 * @param {String} [opts.output='./result.tcx'] Change the path and name of the output files.
 */
async function actSplit(opts) {
    try {
        const dest = path.parse(opts.output);
        opts. dest1 = path.join(dest.dir, dest.name + '-1' + dest.ext);
        opts. dest2 = path.join(dest.dir, dest.name + '-2' + dest.ext);
        await splitTCX(opts.src, opts.offset, opts.time, opts.dest1, opts.dest2);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

