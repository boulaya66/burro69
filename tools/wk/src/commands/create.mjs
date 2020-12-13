'use strict';

import createCommand, { runSteps } from './createcommand';
import { readPackageJson, writePackageJson, } from '../lib/workspaces';
import { yarnInstall } from '../lib/yarn';
import { log } from '@burro69/logger';
// TODO: replace by picomatch
import micromatch from 'micromatch';
import path from 'upath';
import fs from 'fs';

export default (prog) => {
    const runCreate = createCommand(_create, prog)
        .extractOption('workspace')
        .extractOption('location')
        .arrayifyOption('dependencies')
        .arrayifyOption('peer')
        .arrayifyOption('dev');

    prog
        .command('create <package> [location]')
        .describe(`Cretate a new package workspace called <newpackage>.Optionally sets its location.Default is packages/newpackage (without org prefix).`)
        .option('--private, -p', 'Sets the new package as private.', false)
        .option('--license, -l', 'The desired package license.', 'MIT')
        .option('--esmodule, -m', 'Set "type":"module" in package.json', false)
        .option('--dependencies, -d', 'A list of package comma-seperated dependencies.', '')
        .option('--dev', 'A list of package comma-seperated dev dependencies.', '')
        .option('--peer', 'A list of package comma-seperated peer dependencies.', '')
        .example('create @myorg/my-package packages/my-package')
        .action(runCreate);
};

/**
 * Internal implementation
 */

function _create(options) {
    let run = runSteps('wk create');

    run.addStep(createStep1, 'check package.json');
    run.addStep(createStep2, 'check package.json workspaces');
    run.addStep(createStep3, 'parse package location');
    run.addStep(createStep4, 'Write package.json');
    run.addStep(createStep5, 'execute yarn install');
    run.addStep(createStep6, 'execute wk tree');

    run(0, options);
}

const createStep1 = (context) => {
    let mainJson = readPackageJson();
    if (!mainJson) {
        log.error(`Error: could not find package.json.`);
        log.important(`Try 'wk init -f'`);
        process.exit(0);
    }
    context.mainJson = mainJson;
};

const createStep2 = (context) => {
    if (!context.mainJson.workspaces) {
        log.error(`Error: this is not a yarn workspaces environment.`);
        log.important(`Try 'wk init -f'`);
        process.exit(0);
    }
};

const createStep3 = (context) => {
    parseLocation(context);
    log.info(`Create a workspace for package ${context.workspace} at ${context.location}.`);

    log(`Create dir ${context.location}`);
    fs.mkdirSync(context.location, { recursive: true });
    fs.mkdirSync(path.joinSafe(context.location, 'src'), { recursive: true });

    log(`Create file ${path.normalizeSafe(context.location + '/package.json')}`);
    const packageJson = {
        name: context.workspace,
        version: '0.0.0',
        main: `dist/${context.workspace.replaceAll('@', '').replaceAll('/', '.')}.js`,
        source: 'src/index.js'
    };
    if (context.esmodule)
        packageJson['type'] = "module";
    if (context.private)
        packageJson.private = true;
    packageJson['license'] = context.license.replaceAll('\'', '');
    if (context.dependencies.length) {
        packageJson.dependencies = {};
        context.dependencies.forEach(dep => {
            const { imp, ver } = importName(dep);
            if (imp)
                packageJson.dependencies[imp] = ver;
            else
                log.error(`could not resolve dependency ${dep}`);
        });
    }
    if (context.peer.length) {
        packageJson.peerDependencies = {};
        context.peer.forEach(dep => {
            const { imp, ver } = importName(dep);
            if (imp)
                packageJson.peerDependencies[imp] = ver;
            else
                log.error(`could not resolve dependency ${dep}`);
        });
    }
    if (context.dev.length) {
        packageJson.devDependencies = {};
        context.dev.forEach(dep => {
            const { imp, ver } = importName(dep);
            if (imp)
                packageJson.devDependencies[imp] = ver;
            else
                log.error(`could not resolve dependency ${dep}`);
        });
    }
    fs.writeFileSync(path.normalizeSafe(context.location + '/package.json'), JSON.stringify(packageJson, null, 2));

    log(`Create file ${path.normalizeSafe(context.location + '/src/index.js')}`);
    fs.writeFileSync(path.normalizeSafe(context.location + '/src/index.js'), '\n\n\n// ___EOF___\n');
};

const createStep4 = (context) => {
    log.info(`Updating package.json...`);

    const wksDir = context.mainJson.workspaces.find(dir => micromatch.isMatch(context.location, dir));
    log(`Location ${context.location} ${wksDir ? `matches workspaces ${wksDir}` : `will be added to package.json workspaces`}`);

    if (!wksDir) {
        context.mainJson.workspaces.push(context.location.replaceAll('\\', '/'));
        writePackageJson(context.mainJson);
    }
};

const createStep5 = () => {
    log.info(`Executing 'yarn install'...`);
    yarnInstall();
};

const createStep6 = (context) => {
    log.info(`Executing 'wk tree'...`);
    //context.prog('tree', { silent: true });
    context.prog.cli('tree -s');
};


function parseLocation(context) {
    let location = context.location;
    if (!location) {
        location = context.workspace;
        // remove @org prefix
        location = location.replace(/@[^/]*\//g, '');

        if (!location) {
            log.error(`Error: could not find a suitable location.`);
            process.exit(0);
        }

        // look for generic path in package.json workspaces
        const wksDir = context.mainJson.workspaces.find(dir => dir.endsWith('*'));

        location = wksDir ? path.joinSafe(path.dirname(wksDir), location) : path.joinSafe('./packages', location);
    }

    if (fs.existsSync(location)) {
        log.error(`Error: ${location} already exists.`);
        process.exit(0);
    }

    context.location = location;
}

function importName(value) {
    let _org = '';
    let _name = value;
    let _ver = '';
    const matches = [...value.matchAll(/^(@[^/]*\/)?([^@]*)(@(.*))?/g)];
    if (matches && matches.length) {
        _org = matches[0][1];
        _name = matches[0][2];
        _ver = matches[0][4] || "latest";
    } else {
        log.error(`could not resolve dependency ${value}`);
        _name = '';
    }

    return {
        def: _name
            .split('-')
            .map(key => key.charAt(0).toUpperCase() + key.slice(1))
            .join(''),
        imp: (_org ? _org : '') + _name,
        ver: _ver
    };
}

// ___EOF___
