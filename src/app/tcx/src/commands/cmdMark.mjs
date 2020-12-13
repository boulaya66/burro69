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
import { markTCX } from "../lib/index.mjs";


/**
 * memberof module:tcx
 * memberof tcx/commands
 * file tcx app: commands/cmdMark.mjs
 */

/**
 * tcx ``mark`` command (alias m)
 * 
 * Mark tcx file at offset (by default distance in meters).Resulting in two new laps.
 * 
 * Usage: ```tcx mark <src> <offset> [options]```
 * @alias cmdMark
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx mark activity1.tcx 25000 --output activity.tcx --time
 * @see {@link actMark} for information on the handler.
 */
const cmdMark = {
    usage: 'mark <src> <offset>',
    alias: ['m'],
    describe: 'Mark tcx file at offset (by default distance in meters).Resulting in two new laps.',
    default: false,
    options: [
        ['--output, -o', 'Change the name of the output file', 'result.tcx'],
        ['--time, -t', 'Offset is a time offset (in seconds) instead of a distance.', false]
    ],
    categories: {},
    example: [
        'mark activity1.tcx 25000 --output activity.tcx --time'
    ],
    middlewares: [
        extractOption('src'),
        extractOption('offset')
    ],
    action: actMark
};

export default cmdMark;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdMark} handler
 * @alias actMark
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `mark` cli options.
 * @param {String} opts.src Source file to mark.
 * @param {String} opts.offset The offset of the trackpoint where to split the lap.
 * @param {Boolean} [opts.time=false] Offset is a time offset (in seconds) instead of a distance..
 * @param {String} [opts.output='./result.tcx'] Change the path and name of the output file.
 */
async function actMark(opts) {
    try {
        opts.dest = path.parse(opts.output);
        await markTCX(opts.src, opts.offset, opts.time, opts.dest);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

