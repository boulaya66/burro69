'use strict';

import sade from 'sade';
import setupInit from './init';
import setupCreate from './create';
import setupTree from './tree';
import setupBuild from './build';
import setupConsole from './console';
import { isString, isArray, cloneObject } from '@burro69/helpers';

const version = '0.1.0';

const prog = sade('wk');

prog.version(version);

setupInit(prog);
setupCreate(prog);
setupTree(prog);
setupBuild(prog);
/**
 * must be last one !!
 */
setupConsole(prog);


prog.cli = (function (arr) {
    if (isString(arr))
        arr = arr.split(' ');
    if (!isArray(arr))
        throw new Error(`invalid arguments in prog.cli: should be either a string or an array and is ${typeof arr}.`);
    arr = ['', ''].concat(arr);

    // sade.js modifies command alias and default when parsing via mri
    let _alias = {};
    let _default = {};
    let _cmd = this[this.default][arr[2]];
    if (_cmd) {
        if (isString(_cmd))
            _cmd = this[this.default][_cmd];
        _alias = cloneObject(_cmd.alias);
        _default = cloneObject(_cmd.default);
    }

    this.parse(arr);

    // sade.js modifies command alias and default when parsing via mri
    if (_cmd) {
        _cmd.alias = _alias;
        _cmd.default = _default;
    }
}).bind(prog);

export default prog;

// ___EOF___
