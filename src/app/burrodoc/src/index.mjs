/**
 * @file This is an intent to jsdoc with true modules
 * @module burrodoc
 */

/**
 * Class Foo
 * @alias Foo
 * @memberof module:burrodoc
 * @class
 */
class Foo {
    /**
     * Foo constructor 
     * @param {string} name A name for the class
     */
    constructor(name) {
        this.name = name;
    }

    /**
     * name getter
     * @member
     */
    get name(){
        return this._name;
    }

    /**
     * name setter
     */
    set name(value){
        this._name = value;
    }
}

/**
 * This is the first exported function by {@link module:burrodoc}
 * 
 * The second parameter is an instance of {@link Foo}
 * @alias fnDocExport1
 * @memberof module:burrodoc
 * @static
 * @param {String} param1 This is the first parameter.
 * @param {Foo} [param2] This is the second parameter
 */
function fnDocExport1(param1, param2) {
    if (param2) 
        return param2;
    return new Foo(param1);
}

/**
 * main entry point
 */
fnDocExport1('toto');

/**
 * An instance of class Foo
 * @type {Foo}
 * @instance
 */
const foo = new Foo();

console.log(foo);