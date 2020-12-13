/**
 * @memberof module:@burro69/helpers
 * @file @burro69/helpers/is: isTYPE functions for type checking
 * @namespace @burro69/helpers/is
 */
'use strict';

/**
 * Check whether param ``obj`` if of type Object or not.
 * @alias isObject
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 */
export const isObject = obj => obj && typeof obj === 'object';

/**
 * Check whether param ``obj`` if of type String or not.
 * @alias isString
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 * @returns {Boolean} True if obj is a string, false otherwise.
 */
export const isString = obj => typeof obj === 'string';

/**
 * Check whether param ``obj`` if of type Function or not.
 * @alias isFunction
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 * @returns {Boolean} True if obj is a function, false otherwise.
 */
export const isFunction = obj => obj instanceof Function;

/**
 * Check whether param ``obj`` if of type Date or not.
 * @alias isDate
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 * @returns {Boolean} True if obj is an instance of Date, false otherwise.
 */
export const isDate = obj => obj instanceof Date;

/**
 * Check whether param ``obj`` if of type Array or not.
 * @alias isArray
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 * @returns {Boolean} True if obj is an Array, false otherwise.
 */
export const isArray = obj => Array.isArray(obj);

/**
 * Check whether param ``obj`` if of type Map or not.
 * @alias isMap
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 * @returns {Boolean} True if obj is an instance of Map, false otherwise.
 */
export const isMap = obj => obj instanceof Map;

/**
 * Check whether param ``obj`` if of type Set or not.
 * @alias isSet
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 * @returns {Boolean} True if obj is an instance of Set, false otherwise.
 */
export const isSet = obj => obj instanceof Set;

/**
 * Check whether param ``obj`` if of type Object and has at least one property.
 * @alias isEmpty
 * @memberof module:@burro69/helpers
 * @memberof @burro69/helpers/is
 * @function
 * @param {Object} obj The object to type-check.
 * @returns {Boolean} True if obj is an Object instance and has at least one property, false otherwise.
 */
export const isEmpty = obj => obj && Object.keys(obj).length === 0 && obj.constructor === Object;

//__ EOF __
