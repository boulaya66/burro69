import {
    extractOption
} from '@burro69/sadex';
import { log } from "@burro69/logger";

/**
 * memberof module:tcx
 * memberof tcx/commands
 * file tcx app: commands/cmdHelp.mjs
 */

/**
 * tcx ``help`` command (alias ``h``)
 * 
 * Show tcx full help.
 * 
 * Usage: ```tcx help [cmd]```
 * @alias cmdHelp
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @example tcx help // show full tcx help
 * @example tcx help list // show list command help
 * @see {@link actHelp} for information on the handler.
 */
const cmdHelp = {
    usage: 'help [cmd]',
    alias: ['h'],
    describe: 'Show tcx full help.',
    default: false,
    options: [],
    categories: {},
    example: [
        'help',
        'help list'
    ],
    middlewares: [
        extractOption('cmd'),
    ],
    action: actHelp
};

export default cmdHelp;

/**
 * Internal commands implementation
 */

/**
 * The {@link cmdHelp} handler
 * @alias actHelp
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `help` cli options.
 * @param {String} [opts.cmd] The command whose help is to display.
 */
async function actHelp(opts) {
    try {
        if (opts.cmd && opts.prog.tree[opts.cmd] && typeof opts.prog.tree[opts.cmd] === 'string')
            opts.cmd = opts.prog.tree[opts.cmd];
        await opts.prog.help(opts.cmd);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

