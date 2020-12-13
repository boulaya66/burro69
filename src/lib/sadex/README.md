# @burro69/sadex

*A set of extensions to [sade.js](https://github.com/lukeed/sade/blob/master/readme.md).*

This module adds a number of functionalities to sade.js :

1. middlewares: to apply on args before calling command handler
    - (a set of predefined middlewares is provided)
1. run steps: run successive handlers
1. allow handler to call other commands
1. configure commands with objects
1. auto configure cli name & ver
1. adding colors
1. adding test mode
1. options category
1. parse async

# Contents

- [@burro69/sadex](#burro69sadex)
- [Contents](#contents)
- [Install](#install)
- [API](#api)
    - [sadex()](#sadex)
    - [Sadex class](#sadex-class)
    - [Middlewares](#middlewares)
- [License](#license)

# Install

Install @burro69/sadex with either npm :

```sh
npm install @burro69/sadex
```

or yarn (*preferred*):

```sh
yarn add @burro69/sadex
```

# API

## sadex()

The main entry point of the module is the static function

```typescript
sadex(name:String, isSingle:Boolean):Sadex
```

which returns a new instance of Sadex class.

See [code documentation](./module-@burro69_sadex.html#sadex) for more information.

## Sadex class

The module also exports the underlying class for easier further improvements:

```javascript
class Sadex extends Sade {
    ...
}
```

See [code documentation](./Sadex.html) for more information.

## Middlewares

A middleware, in Sadex module, is a function that takes the computed command arguments as input and gives them back after any processing.

Typically such a function is the form:

```javascript
const myMiddleware = (...args) => {
    // do whatever you want with args
    return args;
};
```

When an instance of Sadex should run a command, the specified handler is encapsulated in such a way the middlewares are processed before the handler:

```javascript
...
// cmd is the sade.js command to run
args = cmd.middlewares.reduce((acc, fn) => fn.apply(null, acc), args);
return cmd.handler.apply(null, args);
```

A number of predefined middlewares are provided within the module.

- concatOption: concat first argument with all non parsed argument, saves the array in the last argument (witch is ``options``), and removes the option from arguments.
- extractOption: saves the option in the last argument and removes the option from arguments.
- arrayifyOption: transforms a comma separated option in array.
- extractSubOptions: processes a whole set of comma separated options and add them to the ``options`` argument.
- loadConfigMiddleware: loads ``options`` in a the specified config file.

See [code documentation](./module-@burro69_sadex.html#arrayifyOption) for more information.

# License

The JavaScript Templates script is released under the
[MIT license](https://opensource.org/licenses/MIT).
