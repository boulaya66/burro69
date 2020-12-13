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
import { truncTCX } from "../lib/index.mjs";


/**
 * memberof module:tcx
 * memberof tcx/commands
 * tcx app: commands/cmdTrunc.mjs
 */

/**
 * tcx ``trunc`` command (alias `t`)
 * 
 * Truncate tcx file at offset (by default distance in meters).
 * 
 * Usage: ```tcx trunc <src> <offset> [options]```
 * @alias cmdTrunc
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx trunc activity.tcx --time 5270 --output output.tcx
 * @see {@link actTrunc} for information on the handler.
 */
const cmdTrunc = {
    usage: 'trunc <src> <offset>',
    alias: ['t'],
    describe: 'Truncate tcx file at offset (by default distance in meters).',
    default: false,
    options: [
        ['--output, -o', 'Change the name of the output file', './result.tcx'],
        ['--time, -t', 'Offset is a time offset (in seconds) instead of a distance.', false]
    ],
    categories: {},
    example: [
        'trunc activity.tcx --time 5270 --output output.tcx'
    ],
    middlewares: [
        extractOption('src'),
        extractOption('offset')
    ],
    action: actTrunc
};

export default cmdTrunc;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdTrunc} handler
 * @alias actTrunc
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `trunc` cli options.
 * @param {String} opts.src Source file to trunc.
 * @param {String} opts.offset The offset of the trackpoint where to split the lap.
 * @param {Boolean} [opts.time=false] Offset is a time offset (in seconds) instead of a distance..
 * @param {String} [opts.output='./result.tcx'] Change the path and name of the output file.
 */
async function actTrunc(opts) {
    try {
        opts.dest = path.parse(opts.output);
        await truncTCX(opts.src, opts.offset, opts.time, opts.dest);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

