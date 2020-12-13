'use strict';

/********************************************
 * package: @xpreact/router
 *  dependencies
 *      preact-router
 *      preact-router/match
 *      router/redirect
 *  exports:
 *     - preact-router: router for react
 *     - preact-router/match: add-on to match that lets wiring components up to Router changes
 *     - custom Redirect component
 ********************************************/

/**
 * exports:
 *   preact-router & preact-router/match
 */
export * from './preactrouter';

/**
 * Adding helper components
 */
export { Redirect } from './redirect';

// ___EOF___
