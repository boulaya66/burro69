import {
    extractOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";
import { importTCX } from "../lib/index.mjs";

/**
 * memberof module:tcx
 * memberof tcx/commands
 * file tcx app: commands/cmdImport.mjs
 */

/**
 * tcx ``import`` command (alias `i`)
 * 
 * Import sensors from src into dst and save in output.
 * 
 * Usage: ```import <src> <dst> [options]```
 * @alias cmdImport
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx import hr.tcx activity.tcx --hr -o merged.tcx
 * @see {@link actImport} for information on the handler.
*/
const cmdImport = {
    usage: 'import <src> <dst>',
    alias: ['i'],
    describe: 'Import sensors from <src> into <dst> and save in <output>.',
    default: false,
    options: [
        ['--hr', 'Import heart rate sensor values.',false],
        ['--gpx', 'Import distance, position and altitude values.',false],
        ['--cadence', 'Import cadence sensor values.',false],
        ['--speed', 'Import speed sensor values.',false],
        ['--power', 'Import power sensor values.',false],
        ['--running', 'Import running cadence sensor values.',false],
        ['--offset', 'Set a time offset on src track data.', 0],
        ['-o, --output', 'Change the path and name of the output files', './result.tcx']
    ],
    categories: {
        'Sensors': ['hr', 'gpx', 'cadence', 'speed', 'power', 'running']
    },
    example: [
        'import hr.tcx activity.tcx --hr -o merged.tcx'
    ],
    middlewares: [
        extractOption('src'),
        extractOption('dst')
    ],
    action: actImport
};

export default cmdImport;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdImport} handler
 * @alias actImport
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `import` cli options.
 * @param {String} opts.src Source file to import from.
 * @param {String} opts.dst Destination file to export to.
 * @param {Boolean} [opts.hr=false] Import heart rate sensor values.
 * @param {Boolean} [opts.gpx=false] Import distance, position and altitude values.
 * @param {Boolean} [opts.cadence=false] Import cadence sensor values.
 * @param {Boolean} [opts.speed=false] Import speed sensor values.
 * @param {Boolean} [opts.power=false] Import power sensor values.
 * @param {Boolean} [opts.running=false] Import running cadence sensor values.
 * @param {Number} [opts.offset=0] Set a time offset on src track data.
 * @param {String} [opts.output='./result.tcx'] Change the path and name of the output files
 */
async function actImport(opts) {
    try {
        await importTCX(opts.src, opts.dst, opts);        
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

