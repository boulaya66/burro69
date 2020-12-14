//#region imports
/**
 * import external dependencies
 * @private
 */
import path from 'path';
import { mergeObjects, getJsonFileKeys } from '@burro69/helpers';

/**
* Import non prefixed typedefs
* - for jsdoc: this ensures that all links and types will be parsed
* - for vscode: this allows intellisense work properly with jsdoc types
*/
import './typedefs.js';
//#endregion

/**
 * memberof module:@burro69/sadex
 * file @burro69/sadex: Config middlewares
 */
'use strict';

/**
 * Sadex middleware: process an array of options and inject then in args
 * @alias extractSubOptions
 * @memberof module:@burro69/sadex
 * @memberof @burro69/sadex/middlewares
 * @param {string} option - The arrayified option to parse
 * @param {string} [key] - The key of the last arg to affect with the results
 * @return {middleware} A middleware function for sadex.
 */
const extractSubOptions = (option, key = '') => {
    return (...args) => {
        const options = args.slice(-1)[0];

        if (option && options[option]) {
            let currOption = options[option];
            let newOption = {};

            currOption = (typeof currOption === 'string') ? currOption.split(',') : (Array.isArray(currOption)) ? currOption : [];

            currOption.forEach(sub => {
                let [k, v] = sub.split('=');
                if (v === null || v === undefined)
                    v = true;
                if (newOption[k])
                    newOption[k] = [].concat(newOption[k], v);
                else
                    newOption[k] = v;
            });

            options[key || option] = newOption;
        }
        else {
            options[key || option] = {};
        }
        return args;
    };
};

/**
 * Sadex middleware: load configs in package.json (recurse up) and push them in last
 * 
 * passed argument. So that package.json[key] = args.slice(-1)[0].configs
 * @alias loadConfigMiddleware
 * @memberof module:@burro69/sadex
 * @memberof @burro69/sadex/middlewares
 * @param {string} [key] - The key to read in package.json
 * @param {Object} [DEFAULT] - The default config
 * @return {middleware} A middleware function for sadex.
 */
const loadConfigMiddleware = (key, DEFAULT = {}) => {
    return (...args) => {
        // process inputs
        const options = args.slice(-1)[0];

        if (!options.config)
            return args;

        const cfgList = (typeof options.config === 'string') ? options.config.split(',') : (Array.isArray(options.config)) ? options.config : ['default'];
        const cwd = path.resolve(process.cwd(), options.cwd || '.');
        const cfgFile = options.cfgfile || 'package.json';

        // read configs
        //const pkg = getPackageJsonKeys([key, 'main', 'name'], cwd);
        const pkg = getJsonFileKeys([key, 'main', 'name'], cwd, cfgFile);
        if (!(pkg[key]))
            throw new Error(`package.json does not contain any ${key} config.`);
        const main = pkg.main ? path.parse(pkg.main) : { dir: './dist', name: '', ext: '' };
        const pkgConfig = pkg[key];

        // initialize
        pkgConfig.default = mergeObjects(DEFAULT, pkgConfig.default || {});
        pkgConfig.default.name = pkgConfig.default.name || pkg.name?.replace(/^@.*\//, '').toLowerCase() || path.basename(cwd);
        pkgConfig.force = options.force || {};
        pkgConfig.default.main = main;
        pkgConfig.default.cfgFile = cfgFile;
        const configs = [];

        // process each build config
        for (let cfg of cfgList) {
            if (!pkgConfig[cfg])
                throw new Error(`package.json does not contain any ${pkgConfig} config.`);
            const opts = mergeObjects(pkgConfig.default, pkgConfig[cfg], pkgConfig.force);
            opts.config = cfg;
            configs.push(opts);
        }

        // returns back results
        options.defaultConfig = pkgConfig.default;
        options.forcedConfig = pkgConfig.force;
        options.configs = configs;
        delete (options.force);
        delete (options.config);
        return args;
    };

};

/**
 * Module export concatOption, extractOption, arrayifyOption
 * @private
 */
export {
    extractSubOptions,
    loadConfigMiddleware
};

//___EOF___
