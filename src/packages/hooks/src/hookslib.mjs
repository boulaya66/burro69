'use strict';

// preact/hooks
import {
    useMemo
} from './preacthooks';//from 'preact/hooks';

/********************************************
 * package: @xpreact/hooks/hookslib
 *  dependencies
 *      preact/hooks
 *  exports:
 *     - useFnRef
 *     - useFactory
 ********************************************/

export const useFnRef = (f) => useMemo(() => {
    const callback = (...args) => callback.current && callback.current(...args);
    callback.current = f;
    return callback;
});

export const useFactory = (factory, ...args) => useMemo(() => factory(...args), [].concat(...args));

//__ EOF __
