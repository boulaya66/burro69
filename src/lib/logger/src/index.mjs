//#region jsdoc typedefs
/**
 * Changes the logger function if specified, otherwise sets back the 
 * default logger (i.e. console.log).
 * @alias setLogger
 * @typedef {function(function(...*):void):void} setLogger
 * @param {function(...*):void} [newLogger] The logger function to set.
 * @memberof module:@burro69/logger
 */
/**
 * Toggles the logger to silent mode / verbose mode
 * @alias setSilent
 * @typedef {function(Boolean):void} setSilent 
 * @param {Boolean} [silent=true] If true, the logger will not print anything more on the console.
 * @memberof module:@burro69/logger
 */
/**
 * @memberof module:@burro69/logger
 * @file @burro69/logger module: logger
 * @namespace @burro69/logger
 */
//#endregion

'use strict';

//#region Import external dependencies
/**
 * Node.js builtin module: fs
 * @external fs
 * @see {@link https://nodejs.org/dist/latest-v15.x/docs/api/fs.html|node.js fs documentation}
 */
import fs from 'fs';
/**
 * chalk : Terminal string styling done right
 * @external chalk
 * @see {@link https://github.com/chalk/chalk|chalk documentation}
 */
import chalk from 'chalk';
//#endregion

/**
 * @file @burro69/logger module: logger
 * @module @burro69/logger
 * @version 0.1.0
 * @author Philippe Gensane
 * @license MIT
 * @requires fs
 * @requires chalk
 * @exports log
 */

//#region internal variables
let _defaultLogger = console.log.bind(console);
let _logger = _defaultLogger;
let _silent = false;
let _indent = 0;
//#endregion

//#region stream
// write stream
let _stream;

/**
 * Open a new log stream on the specified path.
 * @access package
 * @param {String} path The file path of the new log stream.
 */
function openStream(path) {
    _stream = fs.createWriteStream(path, { flags: 'a' });
}
/**
 * Close current log stream, if any.
 * @access package
 */
function closeStream() {
    if (!_stream)
        return;
    _stream.end();
    _stream = null;
}

/**
 * Writes log in the open stream.
 * @see {@link openStream}
 * @access package
 * @param {...string} args The log parts to concatenate and write.
 */
function writeStream(...args) {
    if (!_stream)
        return;
    _stream.write(new Date().toLocaleString('fr-FR') + ' : ' + args.join(' ') + '\n');
}
//#endregion

//#region log
/**
 * Logger lib: print styled text
 * @alias log
 * @memberof @burro69/logger
 * @static
 * @type {function(...any):void}
 * @property {function(string):void} log Self reference
 * @property {function(string):void} info Display a text in <span style="color:cyan">cyan Bright</span> color.
 * @property {Function} error Display a text in <span style="color:red">red Bright</span> color.
 * @property {Function} warn Display a text in <span style="color:yellow">yellow Bright</span> color.
 * @property {Function} success Display a text in <span style="color:lime">green Bright</span> color.
 * @property {Function} important Display a text in <span style="color:while"><b>white Bright</b></span> color.
 * @property {setLogger} setLogger Allow to change the underlying logger function (console.log by default).
 * @property {setSilent} silent Toggles the logger to silent mode / verbose mode
 * @property {Function} indent Indent next logs by 1 increment (meaning 2 chars)
 * @property {Function} unIndent Unindent next logs by 1 increment (meaning 2 chars).
 * @property {Function} toFile {@link module:@burro69/logger~closeStream|Close} current file output stream (if one) , and {@link module:@burro69/logger~openStream|open} a new one, if specified. If an output file stream is open, all logs {@link module:@burro69/logger~writeStream|go} to the file AND the console.
 * @param {...*} args 
 */
const log = (...args) => _log(...args);

function _log(...args) {
    if (!_silent)
        _indent ? _logger(new Array(_indent).join('  '), ...args) : _logger(...args);
    writeStream(...args);
    return log;
}

log.log = log;

log.info = (text) => log(chalk.cyanBright(text));

log.error = (text) => log(chalk.redBright(text));

log.warn = (text) => log(chalk.yellowBright(text));

log.success = (text) => log(chalk.greenBright(text));

log.important = (text) => log(chalk.whiteBright(text));

log.setLogger = (newLogger) => {
    if (newLogger)
        _logger = newLogger;
    else
        _logger = _defaultLogger;
    return log;
};

log.silent = (silent = true) => {
    _silent = silent;
    return log;
};

log.indent = () => {
    _indent += 1;
    return log;
};

log.unIndent = () => {
    _indent -= 1;
    return log;
};

log.toFile = (path) => {
    if (_stream)
        closeStream();
    if (path)
        openStream(path);
    return log;
};
//#endregion

export { log };

// ___EOF___ logger lib
