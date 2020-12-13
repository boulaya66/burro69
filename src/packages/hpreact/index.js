
/**
 * import section
 */
import {
    Component,
    Fragment,
    cloneElement,
    createContext,
    createElement,
    createRef,
    h,
    hydrate,
    isValidElement,
    options,
    render,
    toChildArray
} from 'preact';

import {
    useCallback,
    useContext,
    useDebugValue,
    useEffect,
    useErrorBoundary,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState
} from 'preact/hooks';

import prouter from 'preact-router';

import match from 'preact-router/match.js';

import htm from 'htm';

/**
 * const section
 */
const html = htm.bind(h);

const subscribers = prouter.subscribers;
const getCurrentUrl = prouter.getCurrentUrl;
const route = prouter.route;
const Router = prouter.Router;
const Route = prouter.Route;
const StaticLink = prouter.Link;
const exec = prouter.exec;

const Match = match;
const Link = match.Link;

/**
 * export section
 */
export {
    // from preact
    Component,
    Fragment,
    cloneElement,
    createContext,
    createElement,
    createRef,
    h,
    hydrate,
    isValidElement,
    options,
    render,
    toChildArray,
    // from preact/hooks
    useCallback,
    useContext,
    useDebugValue,
    useEffect,
    useErrorBoundary,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    // from htm
    html,
    // from preact-router
    subscribers,
    getCurrentUrl,
    route,
    Router,
    Route,
    StaticLink,
    exec,
    // from preact-router/match
    Match,
    Link
};