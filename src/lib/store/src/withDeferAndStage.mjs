'use strict';

import {
    invokeUpdate,
    cloneObject,
    mergeObjects
} from '@burro69/helpers';

/********************************************
 * package: @burro69/store/withdefercommit
 *  dependencies
 *      @burro69/helpers
 *  exports:
 *      withDeferResolve: defer notify
 *      withStageCommit: stage changes and then commit
 ********************************************/

/**
 * withDeferResolve
 * @param {*} store 
 */
export const withDeferResolve = (store) => {
    let _deferred = false;
    let _newState = null;
    const _notify = store.notify;

    store.defer = function defer() {
        _deferred = true;
    };

    store.resolve = function resolve() {
        if (_deferred) {
            _deferred = false;
            _notify(_newState);
        }
    };

    store.notify = function deferredNotify(newState) {
        if (_deferred) 
            _newState = newState;
        else 
            _notify(newState);
        
    };

    return store;
};

/**
 * withStageCommit
 * @param {*} store 
 */
export const withStageCommit = (store) => {
    const stages = new Set();

    store.stage = function stage() {
        const _stage = createStage(store, stages);
        stages.add(_stage);
        return _stage;
    };

    store.commit = function commit(stage, overwrite = true) {
        return stage.commit(overwrite);
    };

    store.commitAll = function commitAll(overwrite = false) {
        const newState = Array.from(stages).reduce((acc, stage) => mergeObjects(acc, stage.state), {});
        stages.clear();
        return store.setState(newState, overwrite);
    };

    return store;
};

/**
 * Internal middleware implementation
 */

const createStage = (store, stages) => {
    let staged = cloneObject(store.state);
    const _store = store;

    const stage = {
        get state() {
            return staged;
        },

        set state(value) {
            this.setState(value, false);
        },

        setState(updater, overwrite = false) {
            staged = invokeUpdate(updater, staged, overwrite);

            return staged;
        },

        commit(overwrite = true) {
            if (stages.has(this)) {
                stages.delete(this);
                return _store.setState(staged, overwrite);
            }
            return _store.state;
        }
    };

    return stage;
};

//__ EOF __
