'use strict';

import createCommand, { runSteps } from './createcommand';
import { readPackageJson, readWorkspaces } from '../lib/workspaces';
import { log } from '@burro69/logger';
import chalk from 'chalk';

export default (prog) => {
    const runBuild = createCommand(_build, prog)
        .concatOption('packages')
        .arrayifyOption('format');

    prog
        .command('build [...packages]')
        .describe('Build packages with microbundle.')
        .option('--all', 'Builds all workspaces.', false)
        .option('--recursive, -r', 'Also builds local dependencies.', false)
        .option('--cascade, -c', 'Also builds local dependent workspaces.', false)
        .option('--minify, -m', 'Minify resulting builds.', false)
        .option('--sourcemap, -s', 'Generates sourcemaps of resulting builds.', false)
        .option('--format, -f', 'Select outputs formats.', 'modern,es,cjs')
        .example('build @myorg/my-package --cascade --minify --sourcemap --format modern')
        .action(runBuild);
};

/**
 * Internal implementation
 */

function _build(options) {
    let run = runSteps('wk build');

    run.addStep(buildStep1, 'check workspaces.json');
    run.addStep(buildStep2, 'validate packages to build');
    run.addStep(buildStep3, 'schedule builds');
    run.addStep(buildStep4, 'run builds');

    run(0, options);
}

const buildStep1 = (context) => {
    const mainJson = readPackageJson();
    if (!mainJson || !mainJson.workspaces) {
        log.error(`Error: this is not a yarn monorepo.`);
        log.important(`Try: 'wk init -f`);
        process.exit(0);
    }
    const workspaces = readWorkspaces();
    if (!workspaces) {
        log.error(`Error: no dependency tree.`);
        log.important(`Try: 'wk tree`);
        process.exit(0);
    }
    context.workspaces = workspaces;
};

const buildStep2 = (context) => {
    if (context.all) {
        context.packages = [];
        context.workspaces.forEach((value, key) => context.packages.push(key));
        context.recursive = true;
        context.cascade = true;
    } else {
        context.packages.forEach(key => {
            if (!context.workspaces.has(key)) {
                log.error(`Error: no such package ${key}.`);
                process.exit(0);
            }
        });
    }

    if (!context.packages.length) {
        log.warn('No packages to build.');
        context.end();
    }
};

const buildStep3 = (context) => {
    let display = 'with options';
    //display += chalk.bold` recursive=${chalk.magenta(context.recursive)}`;
    //display += chalk.bold` cascade=${chalk.magenta(context.cascade)}`;
    display += chalk.bold` minify={magenta ${context.minify}}`;
    display += chalk.bold` sourcemap={magenta ${context.sourcemap}}`;
    display += chalk.bold` format={magenta ${context.format}}`;
    log.info(`schedule builds ${chalk.yellowBright(context.packages.join(', '))} ${display}`);

    context.toBuild = [];
    context.packages.forEach(key => {
        const workspace = context.workspaces.get(key);
        addToBuild(context, workspace, context.recursive);
    });
};

const buildStep4 = (context) => {
    log.info('will build following workspaces');
    log.warn('  '+context.toBuild.join(', '));

    context.toBuild.forEach(workspace => {
        log.info(`Building ${workspace}...`);
        buildWorkspace(context, workspace);
    });
};

function addToBuild(context, wk, prev = true) {
    if (wk.internal && prev)
        wk.internal.forEach(w => addToBuild(context, context.workspaces.get(w)));

    if (context.toBuild.indexOf(wk.name) >= 0)
        context.toBuild = context.toBuild.filter(dep => dep !== wk.name);

    context.toBuild.push(wk.name);

    if (wk.usedBy && context.cascade)
        wk.usedBy.forEach(w => addToBuild(context, context.workspaces.get(w), false));
}

function buildWorkspace(context, name) {
    const workspace = context.workspaces.get(name);
    log(`  ${workspace.source} → ${workspace.main}`);
    // TODO: use microbundle
}
// ___EOF___
