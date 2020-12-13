import {
    extractOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";
import { removeTCX } from "../lib/index.mjs";


/**
 * memberof module:tcx
 * memberof tcx/commands
 * tcx app: commands/cmdRemove.mjs
 */

/**
 * tcx 'remove' command description (alias r)
 * 
 * Remove sensors from ``src`` and save in ``output``.
 *
 * Usage: ```tcx remove <src> [options]```
 * @alias cmdRemove
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx remove activity.tcx --hr -o removed.tcx
 * @see {@link actRemove} for information on the handler.
 */
const cmdRemove = {
    usage: 'remove <src>',
    alias: ['r'],
    describe: 'Remove sensors from <src> and save in <output>.',
    default: false,
    options: [
        ['--hr', 'Remove heart rate sensor values.',false],
        ['-s, --speed', 'Remove speed sensor values.',false],
        ['-p --power', 'Remove power sensor values.', false],
        ['-c, --cadence', 'Remove cadence sensor values.', false],
        ['--all', 'Remove all sensor values.', false],
        ['--offset', 'Set an offset on src track data', 0],
        ['-o, --output', 'Change the path and name of the output files', './result.tcx']
    ],
    categories: {
        'Sensors': ['all','hr', 'speed', 'power', 'cadence']
    },
    example: [
        'remove activity.tcx --hr -o removed.tcx'
    ],
    middlewares: [
        extractOption('src')
    ],
    action: actRemove
};

export default cmdRemove;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdRemove} handler
 * @alias actRemove
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `remove` cli options.
 * @param {String} opts.src Source file where to remove data.
 * @param {Boolean} [opts.hr=false] Remove heart rate sensor values.
 * @param {Boolean} [opts.speed=false] Remove speed sensor values.
 * @param {Boolean} [opts.power=false] Remove power sensor values.
 * @param {Boolean} [opts.cadence=false] Remove cadence sensor values.
 * @param {Boolean} [opts.all=false] Remove all sensor values.
 * @param {Number} [opts.offset=0] Set a time offset on src track data.
 * @param {String} [opts.output='./result.txt'] Change the path and name of the output file.
 */
async function actRemove(opts) {
    try {
        await removeTCX(opts.src, opts);        
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

