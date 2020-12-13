//#region import external dependencies
/**
 * Node.js builtin module: path
 * @external path
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/path.html|node.js path documentation}
 */
import path from 'path';
/**
 * Node.js builtin module: fs
 * @external fs
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/fs.html|node.js fs documentation}
 */
import fs from 'fs';
import { mergeObjects } from './useful.mjs';
import { isString, isArray } from './is.mjs';
//#endregion

/**
 * @memberof module:@burro69/helpers
 * @file @burro69/helpers/jsonfile: utilities to load and merge json config files
 * @requires path
 * @requires fs
 * @namespace @burro69/helpers/jsonfile
 */
'use strict';

/**
 * Starting from the given`cwd` dir, finds recursively (up) `json files`. Stop 
 * searching when `max` files have been found or fs root is reached.
 * 
 * The resulting array is reversed before returned, so that first found file is 
 * at the beginning of the array.
 * @alias findJsonFile
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/jsonfile
 * @function
 * @param {String} cwd The directory where to start the lookup.
 * @param {String} json The name of the json file to look for.
 * @param {number} [max=Infinity] The maximum number of files to retrieve.
 * @returns {String[]} The array of found json files.
 */
export const findJsonFile = (cwd, json, max = Infinity) => {
    const results = [];
    recurse(cwd, max);
    return results.reverse();

    function recurse(dir, iter = Infinity) {
        let file = path.join(dir, json);
        if (fs.existsSync(file)) {
            iter--;
            results.push(file);
        }
        if (iter <= 0)
            return;
        let newDir = path.join(dir, '..');
        if (dir === newDir)
            return;
        return recurse(newDir, iter);
    }
};

/**
 * Find the list of matching json files with {@link findJsonFile}, load them in 
 * objects and finally {@link mergeObjects deep merge} the results in object.
 * @alias getJsonFile
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/jsonfile
 * @function
 * @param {String} cwd The directory where to start the lookup.
 * @param {String} json The name of the json file to look for.
 * @param {number} [max=Infinity] The maximum number of files to retrieve.
 * @returns {Object} All the found files merged into a single object.
 */
export const getJsonFile = (cwd, json, max = Infinity) => {
    const packages = findJsonFile(cwd, json, max)
        .map(pkg => JSON.parse(fs.readFileSync(pkg)));

    return mergeObjects(...packages);
};

/**
 * Similar to {@link getJsonFile}, but only merges given keys. This allow to 
 * filter the properties of the resulting object.
 * @alias getJsonFileKeys
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/jsonfile
 * @function
 * @param {String[]|String} keys An array or a comma separated string of the keys to retrieve.
 * @param {String} cwd The directory where to start the lookup.
 * @param {String} json The name of the json file to look for.
 * @param {number} [max=Infinity] The maximum number of files to retrieve.
 * @returns {Object} All the found files merged into a single object.
 */
export const getJsonFileKeys = (keys, cwd, json, max = Infinity) => {
    const packages = findJsonFile(cwd, json, max)
        .map(pkg => JSON.parse(fs.readFileSync(pkg)));

    return mergePackages(keys, ...packages);
};

/**
 * Similar to {@link findJsonFile}, but look exclusively 'package.json' files.
 * @alias findPackageJson
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/jsonfile
 * @function
 * @param {String} cwd The directory where to start the lookup.
 * @param {number} [max=Infinity] The maximum number of files to retrieve.
 * @returns {String[]} The array of found json files.
 */
export const findPackageJson = (cwd, max = Infinity) => {
    return findJsonFile(cwd, 'package.json', max);
};

/**
 * Similar to {@link getJsonFile}, but look exclusively 'package.json' files.
 * @alias getPackageJson
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/jsonfile
 * @function
 * @param {String} cwd The directory where to start the lookup.
 * @param {number} [max=Infinity] The maximum number of files to retrieve.
 * @returns {Object} All the found files merged into a single object.
 */
export const getPackageJson = (cwd, max = Infinity) => {
    return getJsonFile(cwd, 'package.json', max);
};

/**
 * Similar to {@link getJsonFileKeys}, but look exclusively 'package.json' files.
 * @alias getPackageJsonKeys
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/jsonfile
 * @function
 * @param {String[]|String} keys An array or a comma separated string of the keys to retrieve.
 * @param {String} cwd The directory where to start the lookup.
 * @param {number} [max=Infinity] The maximum number of files to retrieve.
 * @returns {Object} All the found files merged into a single object.
 */
export const getPackageJsonKeys = (keys, cwd, max = Infinity) => {
    return getJsonFileKeys(keys, cwd, 'package.json', max);
};

//#region internal implementation
// eslint-disable-next-line no-unused-vars
const mergePackages = (keys, ...packages) => {
    if (!keys || keys === 'all')
        return mergeObjects(...packages);

    if (typeof keys === 'string')
        keys = keys.split(',');
    if (!Array.isArray(keys))
        return null;

    let result = {};
    keys.forEach(key => result[key] = null);

    packages.forEach(pkg => {
        keys.forEach(key => {
            if (!pkg[key])
                return;
            if (isArray(pkg[key]))
                result[key] = (result[key] || []).concat(pkg[key]);
            else if (isString(pkg[key]))
                result[key] = pkg[key];
            else
                result[key] = mergeObjects(result[key] || {}, pkg[key]);
        });
    });

    return result;
};
//#endregion

//___EOF___
