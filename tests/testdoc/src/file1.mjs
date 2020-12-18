import './typedefs.mjs';
/**
 * @file this file is a member of the namespace, and export a default function
 * @memberof module:index
 */

/**
 * My exported function
 * @alias index1
 * @memberof module:index
 * @param {TStringFunc} arg0 The first argument
 * @returns {TStringFunc} Returns arg0.
 */
function index1(arg0){
    return arg0;
}

/**
 * export
 */
export default /**@exports index1*/ index1;
