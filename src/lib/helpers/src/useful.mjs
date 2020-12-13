/**
 * @memberof module:@burro69/helpers
 * @file @burro69/helpers/useful: useful functions
 * @namespace @burro69/helpers/useful
 */
'use strict';

import { isFunction, isObject } from './is.mjs';

/**
 * Invokes updater function on passed args, if updater is a function, or updater otherwise.
 * @alias invokeOrReturn
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {Function|Object} updater The updater function or object to return
 * @param {...any} args The args to pass to the updater function.
 * @returns {any} Returns `updater(...args)`, if updater is a function, `updater` otherwise.
 */
export const invokeOrReturn = (updater, ...args) => isFunction(updater) ? updater(...args) : updater;

/**
 * Performs `updater(obj)` by the means of {@link invokeOrReturn} and then,
 * 
 * returns the result if `overwrite` is `true`, or a deep merge of the result and `obj`.
 * @alias invokeUpdate
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {Function|Object} updater The updater function or object to return
 * @param {Object} obj The obj to update
 * @param {Boolean} overwrite If false, a deep merge of obj and updater result will be performed
 * @returns {any} Returns the updates if overwrite is true, a deep merge of obj and updates otherwise.
 */
export const invokeUpdate = (updater, obj, overwrite) => {
    const updates = invokeOrReturn(updater, obj);
    return overwrite ? updates : mergeDeep(obj, updates);
};

/**
 * Returns the name property if any, or anonymous | undefined whether 
 * the property doesn't exist or the argument is undefined.
 * @alias functionName
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {any} f The argument whose name property is to check.
 * @returns {string} The name property if any, 'anonymous' or 'undefined' otherwise.
 */
export const functionName = (f) => f ? (f.name ? f.name : '<anonymous>') : 'undefined';

/**
 * Returns passed argument.
 * @alias identity
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param x 
 * @returns {any} Returns `x` argument.
 */
export const identity = x => x;

/**
 * no-operation function.
 * @alias noop
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 */
export const noop = () => { };

/**
 * Returns an empty object (meaning without any property).
 * @alias empty
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @returns {Object} An empty object.
 */
export const empty = () => ({});

/**
 * Deeply clones an object
 * @alias cloneObject
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {Object} obj The object to clone
 * @returns {Object} The clone of the object.
 */
export const cloneObject = (obj) => mergeDeep(obj);

/**
 * Deep merge one or more objects. If only one object is passed, it
 * will be simply cloned. The deep merge is done from left to right, 
 * meaning the last object overwrites the previous ones.
 * @alias mergeObjects
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {...Object} objects The objects to merge.
 * @returns {Object} The merged object.
 */
export const mergeObjects = (...objects) => mergeDeep(...objects);

/**
 * Converts an argument in array.
 * - if `val` is an array, returns `val`
 * - if `val` is null or undefined, returns en empty array
 * - otherwise, returns an array with `val` as the only element.
 * @alias toArray
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {Array|any} val The argument to convert in array.
 * @returns {Array} The converted array.
 */
// eslint-disable-next-line eqeqeq
export const toArray = val => (Array.isArray(val) ? val : val == null ? [] : [val]);

/**
 * Creates a function that will replace passed variables in a string. This is 
 * a kind of dynamic interpolated string factory.
 * 
 * The factory takes a set of (key, value) pairs as input and returns an 
 * interpolating function to apply to strings containing variables in the form 
 * of '${key}'. 
 * 
 * If the key is included in the passed argument, it will be replaced by its 
 * value; if not, the key will be left in the string without '${}' symbols. 
 * @alias strReplaceVarsFactory
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {Object} vars A set of (key,value) pairs
 * @returns {function(string):string} The created interpolating function.
 * @example 
 * const factory = strReplaceVarsFactory({
 *                    name: 'toto'
 *                });
 * let output = factory('My name is ${name}');
 */
export const strReplaceVarsFactory = (vars) => {
    const keys = Object.keys(vars);
    const regex = new RegExp(`\\$\\{(${keys.join('|')})\\}`, 'g');
    return (str) => str.replace(regex, (s, param) => {
        if (keys.includes(param))
            return vars[param];
        return param;
    });
};

/**
 * Creates an interpolating function (see {@link strReplaceVarsFactory}) with the passed 
 * (key,value) pairs and applies it on the passed string.
 * @example 
 * let output = factory('My name is ${name}', {
 *                    name: 'toto'
 *                });
 * @alias strReplaceVars
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/useful
 * @function
 * @param {String} str The string to interpolate.
 * @param {Object} vars A set of (key,value) pairs.
 * @returns {String} The interpolated string. 
 */
export const strReplaceVars = (str, vars) => strReplaceVarsFactory(vars)(str);

//#region Internal implementation
function mergeDeep(...objects) {
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];

            if ((Array.isArray(pVal) || !pVal) && Array.isArray(oVal))
                prev[key] = pVal ? Array.from(new Set(pVal.concat(...oVal))) : oVal.slice();
            else if ((isObject(pVal) || !pVal) && isObject(oVal))
                prev[key] = pVal ? mergeDeep(pVal, oVal) : mergeDeep(oVal);
            else
                prev[key] = oVal;
        });

        return prev;
    }, {});
}
//#endregion

//__ EOF __
