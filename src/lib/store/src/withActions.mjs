'use strict';

import {
    isFunction,
    isString,
    functionName
} from '@burro69/helpers';

/********************************************
 * package: @burro69/store/withActions
 *  dependencies
 *      @burro69/helpers
 *  exports:
 *      withActions: store actions plugin
 ********************************************/

export const withActions = (store) => {
    const actions = new Map();

    store.action = _action.bind(store, actions);
    store.addAction = store.action;
    store.removeAction = (action) => actions.delete(action);
    store.hasAction = (action) => actions.has(action);
    store.clearActions = () => actions.clear();
    store.exec = _exec.bind(store, actions);
    store._dump = _dumpWithActions.bind(store, actions, store._dump);

    return store;
};

/**
 * Internal middleware implementation
 */

function _action(actions, action, produce) {
    if (!isString(action) || !action)
        throw new Error('action: Invalid action name.');

    if (!isFunction(produce))
        throw new Error(`action: produce should be a Function and is of type ${typeof produce}.`);

    if (actions.get(action))
        throw new Error(`action '${action}' already exists.`);

    const name = (produce.name ? produce.name : action + '_action');
    produce = produce.bind(null);
    Object.defineProperty(produce, 'name', { value: name });

    actions.set(action, produce);

    return this;
}

function _exec(actions, action, ...args) {
    const produce = actions.get(action);

    produce && produce(this, ...args);

    return this;
}

function _dumpWithActions(actions, callFirst) {
    callFirst();

    console.group(`Actions (${actions.size}):`);
    actions.forEach((value, key) => console.log(`${key}: ${functionName(value)}`));
    console.groupEnd();
}

//__ EOF __
