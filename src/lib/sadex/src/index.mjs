//#region imports
/**
 * import external dependencies
 */
/**
 * Node.js builtin module: path
 * @external path
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/path.html|node.js path documentation}
 */
import path from 'path';
/**
 * External dependency: sade
 * @external sade
 * @see {@link https://github.com/lukeed/sade/blob/master/readme.md|sade.js}
 */
import sade from 'sade';
import { log } from '@burro69/logger';
import { isString, isArray, isFunction, isObject, cloneObject, getPackageJson } from '@burro69/helpers';
import {
    concatOption,
    extractOption,
    arrayifyOption,
} from './middlewares.mjs';
import {
    extractSubOptions,
    loadConfigMiddleware
} from './loadconfig.mjs';

/**
 * Import non-prefixed typedefs
 * 
 * - for jsdoc: this ensures that all links and types will be parsed
 * 
 * - for vscode: this allows intellisense work properly with jsdoc types
 */
import './typedefs.js';

/**
 * Get Sade class constructor from external dependency
 * @alias Sade
 * @memberof external:sade
 * @class
 * @see {@link https://github.com/lukeed/sade/blob/master/readme.md|sade.js}
 */
const Sade = sade('', false).constructor;
//#endregion

/**
 * @file @burro69/sadex module: sade.js extensions
 * @module @burro69/sadex
 * @version 0.1.0
 * @author Philippe Gensane
 * @license MIT
 * @todo test steps
 * @todo split index.mjs && create sadex namespace
 * @requires path
 * @requires sade
 * @requires @burro69/logger
 * @requires @burro69/helpers
 * @exports Sadex
 * @exports sadex
 * @exports concatOption
 * @exports arrayifyOption
 * @exports extractOption
 * @exports extractSubOptions
 * @exports loadConfigMiddleware
*/
// TODO: test steps

'use strict';

//#region Class Sadex
/**
 * class Sadex: {@link https://github.com/lukeed/sade/blob/master/readme.md|Sade} extensions
 * 
 * ------------------
 *  - #001: middlewares: to apply on args before calling command handler
 *  - #002: run steps: run successive handlers
 *  - #003: allow handler to call other commands
 *  - #004: configure commands with objects
 *  - #005: auto configure cli name & ver
 *  - #006: adding colors
 *  - #007: adding test mode
 *  - #008: options category
 *  - #009: parse async
 * ------------------
 * 
 * all methods return `this` except specified.
 * @alias Sadex
 * @memberof module:@burro69/sadex
 * @extends Sade
 * @see {@link https://github.com/lukeed/sade/blob/master/readme.md|sade.js}
 */
class Sadex extends Sade {

    /**
     * Sadex constructor: at the moment, just call inherited {@link Sade} constructor
     * @param {String}  str     The name of the cli app. 
     * @param {Boolean} [isOne=false]   True if cli app is a single command app, false otherwise (default false) .
     */
    constructor(str, isOne = false) {
        super(str, isOne);
    }

    /**
     * Sets the handler of the current command
     * @see {@link Sadex Sadex extensions}: #001 #002 #003 #007
     * @param {Function} handler - The handler to set
     */
    action(handler) {
        if (!this.curr)
            return super.action(handler);

        const cmd = this.tree[this.curr];
        const command = this.curr;

        // #002
        if (!handler) {
            const { context, run } = runSteps(this.curr);
            handler = run;
            cmd.context = context;
        }

        // #001
        return super.action((...args) => {
            if (cmd.middlewares)
                args = cmd.middlewares.reduce((acc, fn) => fn.apply(null, acc), args);
            // #003
            let options = args.slice(-1)[0];
            options.prog = this;
            // #007
            if (options.test)
                return this.test(command, ...args);
            return handler.apply(null, args);
        });
    }

    /**
     * Install a {@link middleware} to call before command handler
     * @see {@link Sadex Sadex extensions}: #001 
     * @param {middleware} handler - The middleware to install
     */
    middleware(handler) {
        if (!this.curr)
            throw new Error('Cannot call `middleware()` before defining a command');

        const cmd = this.tree[this.curr];

        if (!cmd.middlewares)
            cmd.middlewares = [];
        cmd.middlewares.push(handler);

        return this;
    }

    /**
     * Install common {@link concatOption} {@link middleware}
     * @see {@link Sadex Sadex extensions}: #001
     * @param {string} key - The name of argument to concat
     */
    concatOption(key) {
        return this.middleware(concatOption(key));
    }

    /**
     * Install common {@link extractOption} {@link middleware}
     * @see {@link Sadex Sadex extensions}: #001
     * @param {string} key - The name of argument to extract
     */
    extractOption(key) {
        return this.middleware(extractOption(key));
    }

    /**
     * Install common {@link arrayifyOption} {@link middleware}
     * @see {@link Sadex Sadex extensions}: #001
     * @param {string} key - The name of option to arrayify
     */
    arrayifyOption(key) {
        return this.middleware(arrayifyOption(key));
    }

    /**
     * Create a new `step` for a `step by step` handler.
     * 
     * Must be called after defining a command AND an empty handler.
     * @see {@link Sadex Sadex extensions}: #002
     * @param {SadexHandlerStep} handler - The handler of the new `step`
     * @param {string} [describe=''] - An optional description of the new `step`
     * @example
     * const prog = sadex('');
     * prog
     *   .command('cmd')
     *   // note null handler to initialize 'run by step' process
     *   .action() 
     *   .step(fn, 'Step 1')
     *   .parse(process.argv);
     */
    step(handler, describe = '') {
        if (!this.curr)
            throw new Error('Cannot call `step()` before defining a command');

        const cmd = this.tree[this.curr];

        if (!cmd.context)
            throw new Error('Cannot call `step()` before defining an empty action');

        cmd.context.steps.push({ handler: handler, describe: describe });

        return this;
    }

    /**
     * Run a registered command from another
     * @see {@link Sadex Sadex extensions}: #003
     * @param {string|String[]} arr - Arguments to pass
     * @returns {*} The result of the sadex command
     * @todo 
     * TODO make it async
     */
    cli(arr) {
        if (isString(arr))
            arr = arr.split(' ');
        if (!isArray(arr))
            throw new Error(`invalid arguments in prog.cli: should be either a string or an array and is ${typeof arr}.`);
        arr = process.argv.slice(0, 2).concat(arr);

        // sade.js modifies command alias and default when parsing via mri
        let _alias = {};
        let _default = {};
        let _cmd = this.tree[arr[2]];
        if (_cmd) {
            if (isString(_cmd))
                _cmd = this.tree[_cmd];
            _alias = cloneObject(_cmd.alias);
            _default = cloneObject(_cmd.default);
        }

        const result = this.parse(arr);

        // sade.js modifies command alias and default when parsing via mri
        if (_cmd) {
            _cmd.alias = _alias;
            _cmd.default = _default;
        }
        return result;
    }

    /**
     * 
     * @see {@link Sadex Sadex extensions}: #004
     * @param {string|SadexCommand} str Either a string (i.e. command usage) or a SadexCommand (i.e. command full config)
     * @param {string} [desc] The Command's description (ignored if str is a SadexCommand).
     * @param {Object} [opts={}] Alias and default options (ignored if str is a SadexCommand).
     * @param {String} opts.alias Optionally define one or more aliases for the Command.
     * @param {Boolean} opts.default Manually set/force the Command to be the Program's default command.
     */
    command(str, desc, opts = {}) {
        if (!isObject(str))
            return super.command(str, desc, opts);
        createCommand(this, str);
        return this;
    }

    /**
     * 
     * @see {@link Sadex Sadex extensions}: #004
     * @param {...SadexCommand[]} args 
     */
    commands(...args) {
        args = args.flat();
        args.forEach(arg => {
            if (!isObject(arg))
                throw new Error(`invalid arguments in prog.commands: arg should be an object and is ${typeof arg}.`);
            this.command(arg);
        });
        return this;
    }

    /**
     * Show command help.
     * @see {@link Sadex Sadex extensions}: #006: adding colors
     * @see {@link Sadex Sadex extensions}: #008: options category
     * @param {string} [cmd] - The name of the command. If not specified, show available commands.
     */
    help(cmd) {
        const commands = new Map();
        Object.keys(this.tree).sort().forEach(key => {
            if (!key.startsWith('_') && typeof this.tree[key] === 'object')
                commands.set(key, this.tree[key]);
        });

        if (!cmd) {
            log.info(`\n${this.bin} v${this.ver} help`);

            log.warn(`  Usage `);
            log(`    $ ${this.bin} <command> [options]`);

            log.success(`  Available commands`);
            let first = '';
            for (const [key, value] of commands) {
                let out = (`    ${key.padEnd(14)} ${value.alibi.join(', ').padEnd(4)} ${truncString(value.describe[0], 60)}`);
                if (this.default === key)
                    log.important(out + ' [default]');
                else
                    log(out);
                if (!first)
                    first = key;
            }

            log.warn('  For more info, run any command with the `--help` flag');
            log(`    $ ${this.bin} ${first} --help`);

            log.warn('  Or try `--test` flag to run in test mode');
            log(`    $ ${this.bin} ${first} [options] --test`);

            log.important(`  Options`);
            log(`    -v, --version    Displays current version`);
            log(`    -h, --help       Displays this message`);

            log();
            return this;
        }

        log.info(`\n${this.bin} v${this.ver} help ${cmd} ${(this.default === cmd ? '[default command]' : '')}`);

        let value = commands.get(cmd);
        let key = cmd;

        log.info(`\n${key} (${value.alibi.join(', ')}) ${truncString(value.describe, 60, true)}`);

        if (value.describe.length) {
            log.important(`  Description`);
            value.describe.forEach(line => log(`    ${line}`));
        }

        log.warn(`  Usage `);
        log(`    $ ${this.bin} ${value.usage} ${value.options.length ? `[Options]` : ''}`);


        if (value.alibi.length) {
            log.warn(`  Aliases`);
            value.alibi.forEach(alias => log(`    $ ${this.bin} ${alias}`));
        }

        if (value.options.length) {
            // #008 
            const options = value.options.slice();
            if (value.categories) {
                for (let [category, opts] of value.categories) {
                    log.success(`  ${category} options`);
                    opts.forEach(o => {
                        let i = options.findIndex(el => el[0].includes('--' + o));
                        if (i >= 0) {
                            let option = options[i];
                            log(`    ${option[0].padEnd(16)} ${wordwrap(option[1], 40, true, option[2] !== undefined ? '.' : ' ').join(`\n${('').padEnd(21)}`)} ${option[2] !== undefined ? `[\`${option[2]}\`]` : ''}`);
                            options.splice(i, 1);
                        }
                    });
                }
            }
            log.success(`  ${value.categories ? 'Other options' : 'Options'}`);
            options.forEach(option => log(`    ${option[0].padEnd(16)} ${wordwrap(option[1], 40, true, option[2] !== undefined ? '.' : ' ').join(`\n${('').padEnd(21)}`)} ${option[2] !== undefined ? `[\`${option[2]}\`]` : ''}`));
            log(`    ${('--test').padEnd(16)} Run in test mode.`);
        }

        if (value.examples.length) {
            log.important(`  Examples`);
            value.examples.forEach(example => log(`    $ ${this.bin} ${example}`));
        }

        log();
        return this;
    }

    /**
     * Show name and version of cli app.
     * @see {@link Sadex Sadex extensions}: #006: adding colors
     */
    _version() {
        log.info(`\n${this.bin} v${this.ver}`);
        return this;
    }

    /**
     * Test arguments parsing for a specific command.
     * @see {@link Sadex Sadex extensions}:  #007: adding test mode.
     * @param {string} command - The command name
     * @param {...*} args - The passed arguments
     */
    test(command, ...args) {
        // initialize
        const cmd = this.tree[command];
        const aliases = Object.keys(cmd.alias || {});
        const options = args.pop();
        const optionsKeys = Object.keys(options);
        options._ && options._.length && args.push(`non parsed: ${options._.join(', ')}`);
        delete (options._);


        // display results
        log.info(`\n${this.bin} v${this.ver} test mode: should run '${cmd.usage}' with`);
        if (args.length) {
            log.warn((`Arguments`));
            args.forEach(arg => log(`  ${arg}`));

        }

        if (cmd.categories) {
            for (let category of cmd.categories.keys()) {
                log.success((`${category} options`));
                for (let key of cmd.categories.get(category)) {
                    if (optionsKeys.includes(key) && options[key] !== undefined) {
                        log(`  ${key}: ${JSON.stringify(options[key], null, 2)}`);
                        delete (options[key]);
                    }
                }
            }
        }

        log.success((`${cmd.categories ? 'Other options' : 'Options'}`));
        for (let [key, value] of Object.entries(options)) {
            if (aliases.includes(key))
                continue;
            if (key === 'prog' || key === 'test' || value === undefined)
                continue;
            log(`  ${key}: ${JSON.stringify(value)}`);
        }

        return this;
    }

    /**
     * Alternative test implementation
     * @private
     */
    _test(command, ...args) {
        // initialize
        const cmd = this.tree[command];
        const aliases = Object.keys(cmd.alias || {});
        const options = args.pop();
        const passed = new Map();
        if (cmd.categories) {
            for (let key of cmd.categories.keys())
                passed.set(key, {});
        }
        passed.set('Other', {});
        const categories = Array.from(cmd.categories.keys());

        // parse arguments
        for (let [key, value] of Object.entries(options)) {
            if (aliases.includes(key))
                continue;
            let found = false;
            for (let category of categories) {
                if (cmd.categories.get(category).includes(key)) {
                    passed.get(category)[key] = value;
                    found = true;
                    continue;
                }
            }
            if (found) continue;
            if (key === '_') {
                value.length && args.push(`non parsed: ${value.join(', ')}`);
                continue;
            }
            passed.get('Other')[key] = value;
        }

        // display results
        log.info(`\n${this.bin} v${this.ver} test mode: should run '${cmd.usage}' with`);
        if (args.length) {
            log.warn((`Arguments`));
            args.forEach(arg => log(`  ${arg}`));

        }

        for (let [category, value] of passed.entries()) {
            if (Object.keys(value).length) {
                log.success((`${category} options`));
                for (let [k, v] of Object.entries(value)) {
                    if (k !== 'prog' && k !== 'test')
                        log(`  ${k}: ${JSON.stringify(v)}`);
                }

            }
        }

        return this;
    }

    /**
     * Group options in a category, for better help and test display.
     * @see {@link Sadex Sadex extensions}:  #008: options category
     * @param {string} category - The name of the group of options
     * @param {...string} args - The list of options to group
     */
    category(category, ...args) {
        if (!this.curr)
            throw new Error('Cannot call `category()` before defining a command');
        const cmd = this.tree[this.curr];

        if (!cmd.categories)
            cmd.categories = new Map();

        cmd.categories.set(category, (cmd.categories.get(category) || []).concat(...args));

        return this;
    }

    /**
     * Asynchronous call to `{@link https://github.com/lukeed/sade#progparsearr-opts|Sade.parse}`.
     * @see {@link Sadex Sadex extensions}:  #009: parse async
     * @param {Array} arr - The array of arguments (mainly `process.argv`).
     * @param {Object} [opts={}] - Optional options, see {@link https://github.com/lukeed/sade#opts-1|sade.js}.
     */
    async parseAsync(arr, opts = {}) {
        return await this.parse(arr, opts);
    }

}
//#endregion

//#region runSteps
// #002: function runSteps
const runSteps = (cmd = '') => {
    const banner = cmd ? cmd + ' ' : '';

    const context = {
        steps: [],
        curr: 0,
        skip(by = 1) {
            for (let i = 1; i <= by; i++)
                console.log(`${banner}[${this.curr + i + 1}/${this.steps.length}] skipped (${this.steps[this.curr + i].describe})`);
            this.curr += by + 1;
        },
        end() {
            console.log(`${banner}[${this.curr + 2}...${this.steps.length}] skip to end`);
            this.curr = -1;
        }
    };

    const run = (...args) => {
        cmd && console.log(`\nRun ${cmd}`);
        context.curr = 0;
        context.args = args;

        while (context.curr >= 0 && context.curr < context.steps.length) {
            console.log(`${banner}[${context.curr + 1}/${context.steps.length}] ${context.steps[context.curr].describe}`);

            const prevStep = context.curr;
            context.steps[context.curr].handler.call(null, context, ...args);

            if (prevStep === context.curr)
                context.curr++;
        }
    };

    return { context, run };
};
//#endregion

//#region createCommand
// #004: function createCommand
const createCommand = (prog, cmd) => {
    const isObjectNotArray = (obj) => !isArray(obj) && isObject(obj);
    const toArray = (value, is, param) => {
        if (is(value))
            value = [value];
        if (!isArray(value))
            throw new Error(`Invalid ${param}: "${value}" is not an array`);
        return value;
    };

    if (!cmd.usage)
        throw new Error('Command config must provide a least a "usage" field');

    // command(usage,desc,opts)
    prog.command(cmd.usage, cmd.describe || '', {
        alias: cmd.alias || [],
        default: (cmd.default === true)
    });

    // example(str)
    if (cmd.example) {
        cmd.example = toArray(cmd.example, isString, 'example');
        cmd.example.forEach(ex => prog.example(ex));
    }

    // option(flags, desc, value)
    if (cmd.options) {
        cmd.options = toArray(cmd.options, isObjectNotArray, 'options');
        cmd.options.forEach(option => {
            if (isArray(option)) {
                if (!option[0] || !isString(option[0]))
                    throw new Error(`Invalid option flags: ${option.join(',')} is not a string`);
                prog.option(option[0], option[1], option[2]);
            } else if (isObject(option)) {
                if (!option.flags || !isString(option.flags))
                    throw new Error(`Invalid option flags: is not a string`);
                prog.option(option.flags, option.desc, option.value);
            } else {
                throw new Error(`Invalid option flags: is not a string`);
            }
        });
    }

    // category(category, ...args)
    if (cmd.categories) {
        if (!isObjectNotArray(cmd.categories))
            throw new Error(`Invalid categories: is not an object`);
        for (let [category, values] of Object.entries(cmd.categories)) {
            if (isArray(values))
                prog.category(category, ...values);
            else if (isString(values))
                prog.category(category, values);
            else
                throw new Error(`Invalid category ${category} values: is neither a string nor an array`);
        }
    }

    // middleware(handler)
    if (cmd.middlewares) {
        cmd.middlewares = toArray(cmd.middlewares, isFunction, 'middlewares');
        cmd.middlewares.forEach(fn => prog.middleware(fn));
    }

    // action(handler) 
    prog.action(cmd.action);

    // step(handler, describe = '')
    if (cmd.steps) {
        cmd.steps = toArray(cmd.steps, isObjectNotArray, 'steps');
        cmd.steps.forEach(step => {
            if (isArray(step)) {
                if (!step[0] || !isFunction(step[0]))
                    throw new Error(`Invalid step handler: is not a function`);
                prog.step(step[0], step[1]);
            } else if (isObject(step)) {
                if (!step.handler || !isFunction(step.handler))
                    throw new Error(`Invalid step handler: is not a function`);
                prog.step(step.handler, step.describe);
            } else {
                throw new Error(`Invalid step handler: is not a function`);
            }
        });
    }
};
//#endregion

//#region helper
function truncString(str, num, pad = false) {
    if (!(typeof str === 'string'))
        str = str.toString();
    if (str.length <= num)
        return pad ? str.padEnd(num) : str;

    return str.slice(0, num - 3) + '...';
}

function wordwrap(str, width, pad, padding = ' ') {
    if (!str)
        return [];

    let lines = [];
    let i = 0;
    while (i < str.length) {
        let line = str.slice(i, i + width);
        lines.push(pad ? line.padEnd(width, padding) : line);
        i += width;
    }

    return lines;

}
//#endregion

//#region sadex
/**
 * Create a new {@link Sadex} instance and auto configure cli name & ver.
 * @alias sadex
 * @memberof module:@burro69/sadex
 * @see {@link Sadex Sadex extensions}: #005: auto configure cli name & ver
 * @param {string} str - The name of the cli app. If not provided, auto-configure with package.json.
 * @param {boolean} [isOne] - True if cli app is a single command app, false otherwise (default false) .
 * @returns {Sadex} The function returns a new instance of {@link Sadex} class.
 */
const sadex = (str, isOne) => {
    let ver = '0.0.0';
    if (str === '') {
        const pkg = getPackageJson(process.cwd(), 1);
        if (pkg.bin) {
            if (isString(pkg.bin))
                str = path.parse(pkg.bin).name;
            else
                str = Object.keys(pkg.bin)[0];
        }
        else {
            str = path.parse(process.argv[1]).name;
        }
        ver = pkg.version || '0.0.0';
    }
    const prog = new Sadex(str, isOne);
    prog.version(ver);
    return prog;
};
//#endregion

//#region exports
/**
 * Module export Sadex, concatOption, extractOption, arrayifyOption, sadex
 * @private
 */
export {
    Sadex,
    concatOption,
    extractOption,
    arrayifyOption,
    extractSubOptions,
    loadConfigMiddleware,
    sadex
};
export * from './typedefs.js';
//#endregion

//___EOF___
