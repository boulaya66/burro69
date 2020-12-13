'use strict';

// preact/hooks
import {
    useEffect,
    useErrorBoundary,
    useReducer,
    useRef
} from './preacthooks';//from 'preact/hooks';

/********************************************
 * package: @xpreact/hooks/lifecycle
 *  dependencies
 *      preact/hooks
 *  exports:
 *     - useForceUpdate
 *     - useDidMount
 *     - useDidUpdate
 *     - useWillUnMount
 *     - useDidCatch 
 ********************************************/

export const useForceUpdate = () => useReducer(x => x + 1, 0)[1];

export const useDidMount = (f) => useEffect(() => f && f(), []);

export const useDidUpdate = (f, deps) => {
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        return f && f();
    }, deps);
};

export const useWillUnMount = (f) => useEffect(() => () => f && f(), []);

export const useDidCatch = (f) => useErrorBoundary((error) => f && f(error));

// TODO: check if necessary
/* 
const useWillMount = (f) => useMemo(f, []);

const useWillReceiveProps = (f, ...props) => useMemo(() => f(...props), [].concat(...props)); 
*/

//__ EOF __
