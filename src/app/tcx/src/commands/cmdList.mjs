import { log } from "@burro69/logger";

/**
 * memberof module:tcx
 * memberof tcx/commands
 * file tcx app: commands/cmdList.mjs
 */

/**
 * tcx ``list`` command (alias `l`)
 * 
 * List tcx available commands.
 * 
 * Usage: ```tcx list```
 * @alias cmdList
 * @memberof module:tcx
 * @memberof tcx/commands
 * @constant
 * @type {SadexCommand}
 * @see {@link actList} for information on the handler.
 */
const cmdList = {
    usage: 'list',
    alias: ['l'],
    describe: 'List tcx available commands.',
    default: true,
    options: [],
    categories: {},
    example: ['list'],
    middlewares: [],
    action: actList
};

export default cmdList;

/**
 * Internal commands implementation
 */
/**
 * The {@link cmdList} handler
 * @alias actList
 * @memberof module:tcx
 * @memberof tcx/commands
 * @function
 * @param {Object} opts The command `list` cli options.
 */
async function actList(opts) {
    try {
        const commands = new Map();
        Object.keys(opts.prog.tree).sort().forEach(key => {
            if (!key.startsWith('_') && typeof opts.prog.tree[key] === 'object')
                commands.set(key, opts.prog.tree[key]);
        });
        log.info(`tcx command list :`);
        for (const [key, value] of commands)
            log(`  ${key.padEnd(10)} ${value.alibi.join(', ').padEnd(4)} ${value.describe.join(('\n').padEnd(19))}`);
    } catch (error) {
        log.error(error);
    }
}

//___EOF___

