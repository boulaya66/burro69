/**
 * @memberof module:@burro69/helpers
 * @file @burro69/helpers/equal: equality functions
 * @namespace @burro69/helpers/equal
 */
'use strict';

import { isObject, isFunction, isArray } from './is.mjs';

const
    /**
     * Performs a shallow equality check
     * @alias shallowEqual
     * @memberof module:@burro69/helpers
     * @memberof @burro69/helpers/equal
     * @function
     * @param {any} a Left operand
     * @param {any} b Right operand
     * @returns {Boolean} True if a 'shallow equals' b, false otherwise.
     */
    shallowEqual = (a, b) => _equal(a, b, Object.is),
    /**
     * Performs a deep equality check
     * @alias deepEqual
     * @memberof module:@burro69/helpers
     * @memberof @burro69/helpers/equal
     * @function
     * @param {any} a Left operand
     * @param {any} b Right operand
     * @returns {Boolean} True if a 'deeply equals' b, false otherwise.
     */
    deepEqual = (a, b) => _equal(a, b, _deep),
    /**
     * Performs a deep equality check
     * @alias Equals
     * @memberof module:@burro69/helpers
     * @memberof @burro69/helpers/equal
     * @type {Map}
     * @property {function} is Object.is
     * @property {function} shallow {@link shallowEqual}
     * @property {function} deep {@link deepEqual}
     */
    Equals = new Map([
        ['is', Object.is],
        ['shallow', shallowEqual],
        ['deep', deepEqual]
    ]);

export { Equals, shallowEqual, deepEqual };

//#region Equality functions: internal implementation
const _deep = (a, b) => {
    if (isArray(a) || isArray(b)) {
        if (_equalArray(a, b))
            return false;
    } else if (isFunction(a) || isFunction(b)) {
        // eslint-disable-next-line eqeqeq
        if (a.toString() != b.toString())
            return false;
    } else {
        if (!_equal(a, b, _deep))
            return false;
    }
    return true;
};

const _equal = (a, b, f) => {
    if (a === b)
        return true;

    // eslint-disable-next-line eqeqeq
    if (!isObject(a) || !isObject(b) || a == null || b == null)
        return false;

    let
        ka = Object.keys(a),
        kb = Object.keys(b);

    // eslint-disable-next-line eqeqeq
    if (ka.length != kb.length)
        return false;

    for (let k of ka) {

        if (!kb.includes(k))
            return false;

        if (!f(a[k], b[k]))
            return false;
    }

    return true;
};
const _equalArray = (A, B) => (!A || A.length !== B.length || B.some((arg, index) => arg !== A[index]));
//#endregion

//__ EOF __
