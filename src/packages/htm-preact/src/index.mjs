'use strict';

/**
 * import dependencies
 */
// preact
import { h } from 'preact';

// htm
import htm from 'htm';

/********************************************
 * package: @xpreact/hpreact
 *  dependencies
 *    preact
 *    htm
 *  exports:
 *      preact: Fast 3kB alternative to React with the same modern API
 *      htm: JSX-like syntax in plain JavaScript => bind htm to preact
 ********************************************/

/**
 * Extract and export named components
 * preact
 */
export * from 'preact';

/**
 * Extract and export named components
 * htm
 */
export const html = htm.bind(h);

// ___EOF___
