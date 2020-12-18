import './typedefs.mjs';
/**
 * @file this file is the index of the module
 * @memberof module:index
 */

/**
 * Import func from file1.mjs
 */
import index1 from './file1.mjs';

/**
 * Class TheExport
 * memberof module:index
 * class
 * alias TheExport
 */
class TheExport {
    /**
     * The constructor
     * @param {string} name The instance name
     */
    constructor (name){
        this.name = name;
    }

    /**
     * The set name member
     * @param {string} name The instance name
     */
    setName(name){
        this.name = name;
    }
};

/**
 * default export
 * @ignore
 */
export default TheExport;

/**
 * named export
 * @ignore
 */
export {
    index1
} 
