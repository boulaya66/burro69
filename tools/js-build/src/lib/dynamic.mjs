/**
 * jsb app: lib/dynamic.mjs
 */
import { log } from '@burro69/logger';

/**
 * @private
 */
const imported = new Map();

/**
 * Dynamic import external module
 * @param {string} moduleName - The module to import dynamically
 * @param {string} [namedExport='default'] - The named export to get
 * @returns {any} The named export from the module
 * @private
 */
export default async function dynamicImport(moduleName, namedExport = 'default') {
    if (imported.has(moduleName))
        return imported.get(moduleName)[namedExport];

    log.warn(`Loading ${moduleName}.${namedExport}...`);
    let _module = await import(moduleName);
    imported.set(moduleName, _module);
    return _module[namedExport];
}

//___EOF___
