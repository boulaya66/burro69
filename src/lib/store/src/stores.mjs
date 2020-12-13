'use strict';

import { isFunction, isString, isObject } from '@burro69/helpers';

import { _createStore } from './createstore';

/********************************************
 * package: @burro69/store/stores
 *  dependencies
 *      @burro69/helpers
 *      store/createstore
 *  exports:
 *      storeManager
 *      hasStore
 *      getStore
 *      deleteStore
 *      forEachStore
 *      createStore
 *      registerStorePlugin
 ********************************************/

const stores = new Map();

const plugins = new Set();

export const hasStore = (name) => stores.has(name);

export const getStore = (name) => stores.get(name);

export const deleteStore = (name) => stores.delete(name);

export const forEachStore = (cb) => stores.forEach(cb);

export const createStore = (name, initialValue = {}, overwrite = false) => {
    if (!isString(name) || !name)
        throw new Error('createStore: Invalid store name.');

    if (!isFunction(initialValue) && !isObject(initialValue))
        throw new Error(`createStore: initialValue should be either of type Function or Object and is of type ${typeof initialValue}.`);

    if (hasStore(name)) {
        if (!overwrite)
            throw new Error(`createStore: store '${name}' already exists.`);
        deleteStore(name);
    }

    const store = Array.from(plugins).reduce( (acc,plugin) => plugin(acc), _createStore(name, initialValue));

    stores.set(name, store);

    return store;
};

const dumpStores = () => forEachStore((value, key) => {
    console.group(`Store '${key}':`);
    value._dump();
    console.groupEnd();
});

export const registerStorePlugin = plugin => {
    if (!plugins.has(plugin))
        plugins.add(plugin);
    return () => plugins.delete(plugin);
};

export const storeManager = Object.freeze({
    get: getStore,
    has: hasStore,
    delete: deleteStore,
    forEach: forEachStore,
    create: createStore,
    register: registerStorePlugin,
    _dump: dumpStores
});

//__ EOF __