//#region imports
/**
 * Import non prefixed typedefs
 * 
 * - for jsdoc: this ensures that all links and types will be parsed
 * 
 * - for vscode: this allows intellisense work properly with jsdoc types
 */
import './typedefs.js';
//#endregion

/**
 * memberof module:@burro69/sadex
 * file @burro69/sadex: Common middlewares
 */
'use strict';

/**
 * Middleware: concat specified first arg with non parsed arguments,
 * 
 * save that array in options[key] and removes it from args
 * @see {@link Sadex Sadex extensions}: #001 middlewares
 * @alias concatOption
 * @memberof module:@burro69/sadex
 * @memberof @burro69/sadex/middlewares
 * @param {string} key - The option to concat
 * @return {middleware} The returned function is a middleware for Sadex
 */
const concatOption = (key) => {
    return (...args) => {
        const value = args[0];
        const options = args.slice(-1)[0];
        args[0] = (value ? [value] : []).concat(options._);
        options._ = [];
        if (key)
            options[key] = args.shift();
        return args;
    };
};

/**
 * Middleware: extract specified first arg, save that array in options[key]
 * 
 * and removes it from args
 * @see {@link Sadex Sadex extensions}: #001 middlewares
 * @alias extractOption
 * @memberof module:@burro69/sadex
 * @memberof @burro69/sadex/middlewares
 * @param {string} key The option to extract
 * @returns {middleware} The returned function is a middleware for Sadex
 */
const extractOption = (key) => {
    return (...args) => {
        const options = args.slice(-1)[0];
        if (key)
            options[key] = args.shift();
        return args;
    };
};

/**
 * Middleware: transform a comma separated option in array 
 * @see {@link Sadex Sadex extensions}: #001 middlewares
 * @alias arrayifyOption
 * @memberof module:@burro69/sadex
 * @memberof @burro69/sadex/middlewares
 * @param {string} key - The option to arrayify
 * @returns {middleware} The returned function is a middleware for Sadex
 */
const arrayifyOption = (key) => {
    return (...args) => {
        const options = args.slice(-1)[0];
        if (key)
            options[key] = (options[key] && typeof options[key] === 'string') ? options[key].split(',') : [];
        return args;
    };
};

/**
 * Module export concatOption, extractOption, arrayifyOption
 * @private
 */
export {
    concatOption,
    extractOption,
    arrayifyOption,
};

//___EOF___
