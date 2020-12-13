'use strict';

import { useEffect, useMemo, useRef } from './preacthooks';//from 'preact/hooks';

import { useForceUpdate } from './lifecycle';

import { useFnRef, useFactory } from './hookslib';

import { storeManager, createSelector } from '@burro69/store';

import { identity } from '@burro69/helpers';

/********************************************
 * package: @xpreact/hooks/usestore
 *  dependencies
 *      preact/hooks
 *      hooks/lifecycle
 *      hooks/hookslib
 *      @burro69/store
 *      @burro69/helpers
 *  exports:
 *     - useStore
 *     - useStoreEffect
 *     - createUseStore
 *     - createUseStoreEffect
 *     - useSelector 
 ********************************************/

/**
 * useStore
 * @param {*} name 
 * @param {*} selectorFn 
 * @param {*} equalFn 
 */
export const useStore = (name, selectorFn = identity, equalFn = Object.is) => {
    const stateRef = useRef();
    const selectorFnRef = useFnRef();
    const equalFnRef = useFnRef();
    const forceUpdate = useForceUpdate();

    const store = useMemo(() => {
        const store = storeManager.get(name);
        stateRef.current = store ? selectorFn(store.state) : null;
        selectorFnRef.current = selectorFn;
        equalFnRef.current = equalFn;

        return store;
    }, [name, selectorFn, equalFn]);

    useEffect(() => {
        const listener = (newState) => {
            try {
                newState = selectorFnRef(newState);
                if (!equalFnRef(stateRef.current, newState)) {
                    stateRef.current = newState;
                    forceUpdate();
                }
            } catch (error) {
                forceUpdate();
            }
        };

        if (store) {
            listener(store.state);
            return store.subscribe(listener);
        }

    }, [store]);

    return [stateRef.current, store];
};

/**
 * createUseStore
 * @param {*} name 
 */
export const createUseStore = (name) => {
    if (!storeManager.has(name))
        return () => [null, null];
    return (selectorFn = identity, equalFn = Object.is) => useStore(name, selectorFn, equalFn);
};

/**
 * useStoreEffect
 * @param {*} name 
 * @param {*} selectorFn 
 * @param {*} callback 
 * @param {*} equalFn 
 */
export const useStoreEffect = (name, selectorFn = identity, callback, equalFn = Object.is) => {
    const selectorFnRef = useFnRef();
    const equalFnRef = useFnRef();
    const callbackRef = useFnRef();

    const store = useMemo(() => {
        const store = storeManager.get(name);
        selectorFnRef.current = selectorFn;
        equalFnRef.current = equalFn;
        callbackRef.current = callback;

        return store;
    }, [name, selectorFn, callback, equalFn]);

    useEffect(() => {
        if (store)
            return store.subscribe(callbackRef, selectorFnRef, equalFnRef);
    }, [store]);

    return store;
};

/**
 * createUseStoreEffect
 * @param {*} name 
 */
export const createUseStoreEffect = (name) => {
    if (!storeManager.has(name))
        return () => [null, null];
    return (selectorFn = identity, callback, equalFn = Object.is) => useStoreEffect(name, selectorFn, callback, equalFn);
};

/**
 * useSelector
 * @param  {...any} args 
 */
export const useSelector = (...args) => useFactory(createSelector, ...args);

//__ EOF __