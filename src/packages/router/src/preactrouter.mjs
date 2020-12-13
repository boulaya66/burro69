'use strict';

// preact-router
import preactRouter from 'preact-router';

// preact-router/match
import * as preactRouterMatch from 'preact-router/match.js';

/********************************************
 * package: @xpreact/router/preactrouter
 *  dependencies
 *      preact-router
 *      preact-router/match
 *  exports:
 *     - preact-router: router for react
 *     - preact-router/match: add-on to match that lets wiring components up to Router changes
 ********************************************/

/**
 * exports:
 *   preact-router
 */
export const {
    subscribers,
    getCurrentUrl,
    route,
    Router,
    Route,
    exec,
    Link: StaticLink
} = preactRouter;

/**
 * exports:
 *   preact-router/match
 */
export const {
    Match,
    Link
} = preactRouterMatch;

//__ EOF __
