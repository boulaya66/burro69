'use strict';

import chalk from 'chalk';

let defaultLogger = console.log.bind(console);

let logger = defaultLogger;

let _log = logger;

let _silent = false;

export const logInfo = (text) => _log(chalk.cyanBright(text));

export const logError = (text) => _log(chalk.redBright(text));

export const logWarn = (text) => _log(chalk.yellowBright(text));

export const logSuccess = (text) => _log(chalk.greenBright(text));

export const logImportant = (text) => _log(chalk.whiteBright(text));

export const setLogger = (newLogger) => {
    if (newLogger)
        logger = newLogger;
    else
        logger = defaultLogger;
    _log = _silent ? () => { } : logger;
};

const log = (...args) => _log(...args);
log.info = logInfo;
log.error = logError;
log.warn = logWarn;
log.success = logSuccess;
log.important = logImportant;
log.setLogger = setLogger;
log.silent = (silent = true) => {
    _silent = silent;
    _log = silent ? () => { } : logger;
};

export { log };

// ___EOF___