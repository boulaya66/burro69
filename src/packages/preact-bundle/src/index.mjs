'use strict';

/********************************************
 * package: preact-bundle
 *  dependencies
 *      - preact
 *      - htm
 *      - preact-router
 *  exports:
 *      helpers
 *          is: type checking
 *          equal: equality functions
 *          useful: custom function lib
 *      store
 *          createStore
 *          StoreManager
 *          plugins: reducers, selectors, defer/commit
 *      hpreact
 *          preact: Fast 3kB alternative to React with the same modern API
 *          htm: JSX-like syntax in plain JavaScript 
 *              htm => bind htm to preact
 *      hooks
 *          preact/hooks: hooks add-on to preact
 *          lifecycle hooks
 *          custom hooks lib
 *          useStore
 *      router
 *          preact-router: router for react
 *          preact-router/match: add-on to match that lets wiring components up to Router changes
 *          custom Redirect component
 *      request
 *          requestFactory: add cancellation and timeout to fetch
 *      request
 *          requestFactory
 ********************************************/

/**
 * package @xpreact/bundle exports
 */
export * from '@burro69/helpers';

export * from '@burro69/store';

export * from '@xpreact/hpreact';

export * from '@xpreact/hooks';

export * from '@xpreact/router';

export * from '@burro69/request';

// ___EOF___
