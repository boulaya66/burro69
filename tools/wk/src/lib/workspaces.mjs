'use strict';

import fs from 'fs';
import path from 'upath';

let workspaces;

function readWorkspaces() {
    if (!fs.existsSync('./workspaces.json'))
        return null;

    workspaces = objToStrMap(JSON.parse(fs.readFileSync('./workspaces.json')));

    return workspaces;
}

function writeWorkspaces(_workspaces) {
    workspaces = _workspaces;
    fs.writeFileSync('./workspaces.json', JSON.stringify(strMapToObj(workspaces), null, 2));
}

function findWorkspace(_path) {
    if (!workspaces)
        return null;
    let found = null;
    const extPath = path.dirname(_path);
    for (const [, wk] of workspaces.entries()) {
        if (extPath.startsWith(wk.path)) {
            found = wk;
            break;
        }
    }

    return found;
}

function readPackageJson() {
    if (!fs.existsSync('./package.json'))
        return null;

    const mainJson = JSON.parse(fs.readFileSync('./package.json'));

    return mainJson;
}

function writePackageJson(mainJson) {
    fs.writeFileSync('./package.json', JSON.stringify(mainJson, null, 2));
}

readWorkspaces();

export {
    readWorkspaces,
    writeWorkspaces,
    findWorkspace,
    readPackageJson,
    writePackageJson
};

/**
 * internal implementation
 */

function objToStrMap(obj) {
    let strMap = new Map();
    for (let k of Object.keys(obj))
        strMap.set(k, obj[k]);

    return strMap;
}

function strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
        // We don’t escape the key '__proto__'
        // which can cause problems on older engines
        obj[k] = v;
    }
    return obj;
}

// ___EOF___
