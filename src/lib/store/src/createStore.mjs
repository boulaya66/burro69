'use strict';

import {
    invokeOrReturn,
    invokeUpdate,
    Equals,
    functionName,
} from '@burro69/helpers';

/********************************************
 * package: @burro69/store/createstore
 *  dependencies
 *    @burro69/helpers
 *  exports:
 *    createStore: store internal implementation
 ********************************************/

/**
 * createStore
 * @param {string} name - The name of the store
 * @param {object} initialValue - Store initial value
 * @return {object} Store {name, state, setState, subscribe, notify, _dump}
 */
export const _createStore = (name, initialValue) => {
    // data encapsulation
    let state;
    let equalityFn = Equals.get('is');
    const listeners = new Set();

    // minimal store implementation
    const store = {
        get name() {
            return name;
        },

        get state() {
            return state;
        },

        set state(value) {
            this.setState(value, false);
        },

        setState(updater, overwrite = false) {
            const newState = invokeUpdate(updater, state, overwrite);

            if (!equalityFn(state, newState)) {
                state = newState;
                this.notify(newState);
            }

            return state;
        },

        subscribe(listener) {
            if (!listener.name)
                Object.defineProperty(listener, 'name', { value: `listener_${listeners.size}` });
                
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        notify(newState) {
            listeners.forEach(listener => {
                try {
                    return listener(newState);
                } catch (error) {
                    // continue
                }
            });
        }

    };
    // finalize store and update state
    store._dump = _dump.bind(store, listeners);

    state = invokeOrReturn(initialValue, store);

    return store;
};

/**
 * Internal store implementation
 */
function _dump(listeners) {
    console.log(`Store '${this.name}':`);

    console.group('State :');
    console.dir(this.state, { color: true, depth: Infinity });
    console.groupEnd();

    console.group(`Listeners (${listeners.size}):`);
    listeners.forEach(listener => console.log(functionName(listener)));
    console.groupEnd();

    console.group(`Api:`);
    console.log(Object.keys(this).join(', '));
    console.groupEnd();
}

//__ EOF __