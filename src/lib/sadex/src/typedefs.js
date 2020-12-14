//#region external dependencies
/**
 * Node.js builtin module: path
 * @external path
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/path.html|node.js path documentation}
 */
/**
 * Node.js builtin module: fs/promises
 * @external fs
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/fs.html|node.js fs documentation}
 */
/**
 * External dependency: sade
 * @external sade
 * @see {@link https://github.com/lukeed/sade/blob/master/readme.md|sade.js}
 */
/**
 * ansi-to-html external dependency
 * @external ansi-to-html
 * @see {@link https://github.com/rburns/ansi-to-html|ansi-to-html documentation}
 */
//#endregion

//#region  namespaces
/**
 * @memberof module:@burro69/sadex
 * @file @burro69/sadex/typedefs
 * 
 * This namespace exports:
 * - {@link sadex}: main entry of the {@link module:@burr69/sadex|module}
 * - {@link Sadex}: the class extending {@link Sade}
 * - {@link printCommand}: the optional print command
 * @namespace @burro69/sadex
 */

/**
 * @memberof module:@burro69/sadex
 * @file @burro69/sadex/typedefs
 * 
 * This namespace exports:
 * - {@link concatOption}: Concat option middleware
 * - {@link arrayifyOption}: Arrayify option middleware
 * - {@link extractOption}: Extract option middleware
 * - {@link extractSubOptions}: Extract sub-options middleware
 * - {@link loadConfigMiddleware}: Load config middleware
 * @namespace @burro69/sadex/middlewares
 */
//#endregion

//#region typedefs
/**
* Export non prefixed typedefs
* - for jsdoc: this ensures that all links and types will be parsed
* - for vscode: this allows intellisense work properly with jsdoc types
*/

/**
 * Type middleware: function that transform command parsed arguments
 * @alias middleware
 * @typedef {function(...*):Array} middleware
 * @param {...*} args - The passed arguments
 * @return {Array} The transformed arguments
 * @memberof @burro69/sadex/middlewares
 */

/**
 * Type SadexOption: must be either an array (i.e. values of the properties) 
 * or an object.
 * @alias SadexOption
 * @typedef {Object} SadexOption
 * @property {String} flag The Option's flags, which may optionally include 
 * an alias.
 * @property {String} desc The description for the Option.
 * @property {*} [value] The default value for the Option.
 * @memberof @burro69/sadex/middlewares
 */

/**
 * Type SadexHandlerStepContext: This object will contain 
 * the stepping logic (with skip and end methods).
 * @alias SadexHandlerStepContext
 * @typedef {Object} SadexHandlerStepContext 
 * @property {SadexHandlerStepDesc[]} steps 
 * @property {Function} skip Skip next step. 
 * @property {Function} end Skip to end of stepping process.
 * @property {number} curr The index of the current step
 * @property {Array} args The args passed 
 * @memberof @burro69/sadex/middlewares
 */

/**
 * Type SadexHandlerStep: Sadex step handler.
 * @alias SadexHandlerStep
 * @typedef {function(SadexHandlerStepContext,...*):*} SadexHandlerStep 
 * @param {SadexHandlerStepContext} context This object will contain the 
 * stepping logic (with skip and end methods).
 * @param {...*} args - The passed arguments to the command handler
 * @memberof @burro69/sadex/middlewares
 */

/**
 * Type SadexHandlerStepDesc: must be either an array (i.e. values of the 
 * properties) or an object.
 * @alias SadexHandlerStepDesc
 * @typedef {Object} SadexHandlerStepDesc
 * @property {SadexHandlerStep} handler The function handler for `step`.
 * @property {String} [describe] The optional description to be displayed for 
 * the `step`.
 * @memberof @burro69/sadex/middlewares
*/

/**
 * Type SadexCommand: fully configure a command for to be imported in 
 * {@link Sadex} class.
 * @alias SadexCommand
 * @typedef {Object} SadexCommand
 * @property {String} usage The usage pattern for your Command. 
 * @property {String|String[]} describe Add a description to the Command.
 * @property {String|String[]} alias Define one or more aliases for the Command.
 * @property {Boolean} default Manually set/force the Command to be the 
 * Program's default command. 
 * @property {String|String[]} example Add one or more examples for the Command.
 * @property {SadexOption|SadexOption[]} options Add one or more Options to 
 * the Command.
 * @property {Object} categories Define groups of Options, namely categories, 
 * as a [Key,Value] pair Object. 
 * 
 * Each category is a Key,Value pair where the key is the name of the category, 
 * 
 * and the value an array of option names.
 * @property {middleware|middleware[]} middlewares Add one or more middlewares 
 * to execute after arg parsing and before handler execution.
 * @property {Function} action Attach a callback to the Command.
 * @property {SadexHandlerStepDesc|SadexHandlerStepDesc[]} steps Add handler 
 * steps.
  * @memberof @burro69/sadex/middlewares
*/
//#endregion

//___EOF___
