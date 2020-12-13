'use strict';

import createCommand, { runSteps } from './createcommand';
import {
    readPackageJson,
    writePackageJson
} from '../lib/workspaces';
import {
    yarnInit,
    yarnInstall
} from '../lib/yarn';
import { log } from '@burro69/logger';
import fs from 'fs';

export default (prog) => {
    const runInit = createCommand(_init, prog)
        .concatOption('paths');

    prog
        .command('init [...paths]')
        .describe(`Initialize current dir as a yarn workspaces environment.Sets optional Dirs as workspaces paths.Default Dirs are packages/*.`)
        .option('--force, f', 'Force yarn init if current directory is not a repo.', false)
        .example('init packages/*')
        .action(runInit);
};

/**
 * Internal implementation
 */

function _init(options) {
    let run = runSteps('wk init');

    run.addStep(initStep1, 'check package json');
    run.addStep(initStep2, 'yarn init if no package.json and force===true');
    run.addStep(initStep3, 'prepare package.json update');
    run.addStep(initStep4, 'execute yarn install');
    run.addStep(initStep5, 'execute wk tree');

    run(0, options);
}

const initStep1 = (context) => {
    log.info(`Init yarn workspaces. Paths for packages are [${context.paths.join(', ')}]`);

    // check package.json
    let mainJson = readPackageJson();
    if (!mainJson && !context.force) {
        log.error(`Error: could not find package.json.`);
        log.important(`Try 'wk init -f ${context.paths.join(', ')}'`);
        process.exit(0);
    }

    context.mainJson = mainJson;
};

const initStep2 = (context) => {
    if (!context.mainJson && context.force) {
        log.warn(`Could not find package.json.`);
        log.info(`Executing 'yarn init'...`);
        yarnInit();
        context.mainJson = readPackageJson();
        if (!context.mainJson) {
            log.error(`Error: could not find package.json.`);
            process.exit(0);
        }
    }
};

const initStep3 = (context) => {
    context.mainJson.private = true;
    context.mainJson.workspaces = (context.mainJson.workspaces || []);

    // check workspaces paths
    log.info(`Checking given workspaces paths...`);
    context.paths.forEach(p => {
        if (!context.mainJson.workspaces.includes(p))
            context.mainJson.workspaces.push(p);
        p = p.replaceAll('*', '');
        if (!fs.existsSync(p)) {
            log.warn(`  Create path ${p}.`);
            fs.mkdirSync(p);
        } else {
            log.success(`  ${p} already exists.`);
        }
    });

    // Write package.json
    log.info(`Updating package.json...`);
    writePackageJson(context.mainJson);
};

const initStep4 = () => {
    log.info(`Executing 'yarn install'...`);
    yarnInstall();
};

const initStep5 = (context) => {
    log.info(`Executing 'wk tree'...`);
    //context.prog('tree', { silent: true });
    context.prog('tree -s');
};


// ___EOF___
