'use strict';

import createCommand, { runSteps } from './createcommand';
import { readPackageJson, writeWorkspaces } from '../lib/workspaces';
import { log } from '@burro69/logger';
import fs from 'fs';
import path from 'upath';
import chalk from 'chalk';

export default (prog) => {
    const runTree = createCommand(_tree, prog);

    prog
        .command('tree', '', { default: true })
        .describe('Creates/updates workspaces dependency tree.Writes result in "workspaces.json"')
        .option('--silent, -s', 'Do not display generated workspaces json.', false)
        .action(runTree);
};

/**
 * Internal implementation
 */

function _tree(options) {
    let run = runSteps('wk tree');
    try {
        log.silent(options.silent);

        run.addStep(treeStep1, 'check package json');
        run.addStep(treeStep2, 'lookup workspaces');
        run.addStep(treeStep3, 'lookup dependencies');
        run.addStep(treeStep4, 'display results');
        run.addStep(treeStep5, 'write workspaces json');
    
        run(0, options);    
    } catch (error) {
        log.error(`wk tree error: ${error}`);
    } finally{
        log.silent(false);
    }
}

const treeStep1 = (context) => {
    log.info(`Creates/updates workspaces dependency tree. Writes result in "workspaces.json"`);

    const mainJson = readPackageJson();
    if (!mainJson || !mainJson.workspaces) {
        log.error(`Error: this is not a yarn monorepo.`);
        process.exit(0);
    }
    context.mainJson = mainJson;
};

const treeStep2 = (context) => {
    const workspaces = new Map();
    context.mainJson.workspaces
        .map(lookupWorkspace)
        .flat()
        .forEach(wk => workspaces.set(wk.name, wk));
    context.workspaces = workspaces;
};

const treeStep3 = (context) => {
    context.workspaces.forEach(lookupDeps);
};

const treeStep4 = (context) => {
    log.info('Workspaces dependencies graph');
    context.workspaces.forEach((value, key) => {
        log(chalk`  {bold ${chalk.cyan(key)} v${chalk.magenta(value.version)} located at ${chalk.yellow(value.path)}}`);
        log(chalk`    {bold Main    :} {yellow ${value.main}}`);
        log(chalk`    {bold Source  :} {yellow ${value.source}}`);
        log(chalk`    {bold Path    :} {yellow ${value.path}}`);
        log(chalk`    {bold Used by :} \n      ${value.usedBy ? value.usedBy.join(',\n      ') : 'none'}`);
        log(chalk`    {bold Depends on workspaces :} \n      ${value.internal ? value.internal.join(',\n      ') : 'none'}`);
        log(chalk`    {bold Depends on modules    :} \n      ${value.modules ? value.modules.join(',\n      ') : 'none'}`);
    });
};

const treeStep5 = (context) => {
    writeWorkspaces(context.workspaces);
    log.success('Write file "workspaces.json".');
};

function lookupWorkspace(dir) {
    let wks = [];

    if (dir.endsWith('*'))
        return wks.concat(lookupWorkspace(dir.replaceAll('*', '')));

    if (!fs.existsSync(dir)) {
        log.warn(`Warn: ${dir} doesn't exist.`);
        return wks;
    }

    const content = lookupPackage(dir);
    if (content) {
        wks.push(content);
        log(`  ${path.relative(process.cwd(), dir)} => ${content.name}`);
    }
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    dirents.forEach(dirent => {
        if (dirent.isDirectory())
            wks = wks.concat(lookupWorkspace(path.joinSafe(dir, dirent.name)));
    });

    return wks;
}

function lookupPackage(dir) {
    const jsonPath = path.joinSafe(dir, 'package.json');
    if (!fs.existsSync(jsonPath))
        return null;

    const jsonContent = JSON.parse(fs.readFileSync(jsonPath));

    let deps = [];
    if (jsonContent.dependencies)
        deps = deps.concat(Object.keys(jsonContent.dependencies));
    if (jsonContent.devDependencies)
        deps = deps.concat(Object.keys(jsonContent.devDependencies));
    if (jsonContent.peerDependencies)
        deps = deps.concat(Object.keys(jsonContent.peerDependencies));

    const files = [];//getFiles(dir);

    return {
        name: jsonContent.name,
        version: jsonContent.version,
        source: jsonContent.source,
        main: jsonContent.main,
        path: dir,
        deps,
        files
    };
}

function lookupDeps(value, key, map) {
    value.deps.forEach(dep => {
        const depInfo = map.get(dep);
        if (depInfo) {
            depInfo.usedBy = (depInfo.usedBy || []).concat(key);
            value.internal = (value.internal || []).concat(dep);
        } else {
            value.modules = (value.modules || []).concat(dep);
        }
    });
}

// ___EOF___
