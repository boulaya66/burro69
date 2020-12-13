'use strict';

import {
    Equals,
    identity,
    isString,
    isFunction,
    isArray
} from '@burro69/helpers';

/********************************************
 * package: @burro69/store/withSelectors
 *  dependencies
 *      @burro69/helpers
 *  exports:
 *      withSelectors: store selector plugin
 *      createSelector: create selector function
 ********************************************/

export const withSelectors = (store) => {
    const _subscribe = store.subscribe;
    
    store.subscribe = (listener, selectorFn, equalityFn) => {
        if (selectorFn || equalityFn)
            listener = watch(store, listener, selectorFn, equalityFn);

        return _subscribe.call(store, listener);
    };

    return store;
};

export const createSelector = (paths) => {
    if (isArray(paths)) {
        const selectors = [];
        paths.forEach(path => selectors.push(createSelector(path)));

        return obj => selectors.map(selector => selector(obj));
    }

    if (!isString(paths) || !paths)
        throw new Error('createSelector: Invalid selector path.');

    paths = paths.split('.');
    const keys = [];
    paths.forEach(key => {
        const found = key.match(/^(.+)\[(.*)\]$/);
        if (found) {
            keys.push(found[1]);
            keys.push(acc => acc[found[2]]);
        } else {
            keys.push(key);
        }
    });

    return obj => keys.reduce((acc, key) => acc ? (isFunction(key) ? key(acc) : acc[key]) : null, obj);
};


/**
 * Internal middleware implementation
 */

let watchers = 0;

const watch = (store, listener, selectorFn = identity, equalityFn = Equals.get('is')) => {
    let selectedState = selectorFn(store.state);

    const newListener = (newState) => {
        try {
            const newSelected = selectorFn(newState);

            if (!equalityFn(newSelected, selectedState)) {
                selectedState = newSelected;
                listener && listener(selectedState);
            }
        } catch (error) {
            // continue with other listeners
        }
    };

    const name = (listener.name ? listener.name : `selectorListener_${watchers++}`);
    Object.defineProperty(newListener, 'name', { value: name });

    return newListener;
};

//__ EOF __