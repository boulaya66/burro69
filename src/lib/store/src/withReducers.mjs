'use strict';

import {
    isFunction,
    isString,
    functionName
} from '@burro69/helpers';

/********************************************
 * package: @burro69/store/withReducers
 *  dependencies
 *      @burro69/helpers
 *  exports:
 *      withReducers: store reducer plugin
 ********************************************/

export const withReducers = (store) => {
    const reducers = new Map();

    store.reducer = _reducer.bind(store, reducers);
    store.addReducer = store.reducer;
    store.removeReducer = (action) => reducers.delete(action);
    store.hasReducer = (action) => reducers.has(action);
    store.clearReducers = () => reducers.clear();
    store.dispatch = _dispatch.bind(store, reducers);
    store._dump = _dumpWithReducers.bind(store, reducers, store._dump);

    return store;
};

/**
 * Internal middleware implementation
 */

function _reducer(reducers, action, reduce/* , overwrite = false */) {
    if (!isString(action) || !action)
        throw new Error('reducer: Invalid reducer name.');

    if (!isFunction(reduce))
        throw new Error(`reducer: reduce should be a Function and is of type ${typeof reduce}.`);

    if (reducers.has(action))
        throw new Error(`reducer '${action}' already exists.`);

    const name = (reduce.name ? reduce.name : action + '_reduce');
    reduce = reduce.bind(null);
    Object.defineProperty(reduce, 'name', { value: name });

    reducers.set(action, reduce);

    return this;
}

function _dispatch(reducers, action, ...args) {
    const reduce = reducers.get(action);

    reduce && this.setState(reduce(this, ...args));

    return this;
}

function _dumpWithReducers(reducers, callFirst) {
    callFirst();

    console.group(`Reducers (${reducers.size}):`);
    reducers.forEach((value, key) => console.log(`${key}: ${functionName(value)}`));
    console.groupEnd();
}

//__ EOF __
