import { readPackageJson, readWorkspaces } from './lib/workspaces';
import { log } from '@burro69/logger';
import prog from './commands/prog';

import chokidar from 'chokidar';
import path from 'upath';
import os from 'os';

let
    workspaces,
    packages,
    jsonWatcher,
    srcWatchers = new Map();

jsonWatcher = chokidar
    .watch('package.json', {
        persistent: true,
        awaitWriteFinish: true
    })
    .once('ready', () => {
        log.info(`Watching package.json`);
        workspaces = readPackageJson().workspaces;
        if (!workspaces) {
            log.error(`Error: this is not a yarn monorepo.`);
            process.exit(0);
        } else {
            workspaces = workspaces.map(w => w.replace('/**', '').replace('/*', ''));
        }

        checkWorkspacesJson();

        createSrcWatchers();

        jsonWatcher.on('change', (_path) => {
            const old = workspaces;
            try {
                workspaces = readPackageJson().workspaces;
                workspaces = workspaces.map(w => w.replace('/**', '').replace('/*', ''));
            } catch (error) {
                workspaces = old;
            }
            log.success(`  => ${_path} reloaded`);
            if (argsChanged(old, workspaces)) {
                log.warn(`  => Workspaces changed: [${old.join(', ')}] => [${workspaces.join(', ')}]. Run wk tree.`);
                checkWorkspacesJson(true);
                createSrcWatchers();
            }
        });
    });

/**
 * Internal implementation
 */

//#region package watcher

function checkWorkspacesJson(force = false) {
    if (force)
        prog.cli('tree -s');
    packages = readWorkspaces();
    if (!packages) {
        log.warn(`  => No workspaces.json. Run wk tree to create one.`);
        prog.cli('tree -s');
        packages = readWorkspaces();
        if (!packages) {
            log.error(`Error while loading workspaces.json.`);
            process.exit(0);
        }
    }
    log.success(`  => workspaces.json reloaded`);
    return packages;
}

//#endregion

//#region src watchers

function createSrcWatchers() {
    workspaces.forEach(_path => {
        if (!srcWatchers.has(_path)) {
            const _srcWatcher = chokidar
                .watch(_path, {
                    persistent: true,
                    awaitWriteFinish: true
                })
                .on('error', error => {
                    // Ignore EPERM errors in windows, which happen if you delete watched folders...
                    if (error.code === 'EPERM' && os.platform() === 'win32') {
                        log.warn(`ignore error ${error}`);
                        return;
                    }
                    log.error('Error:', error);
                    log.error(error.stack);
                })
                .once('ready', () => {
                    log.info(`Watching ${_path}`);

                    _srcWatcher.on('all', (event, _wPath) => {
                        _wPath = path.normalizeSafe(_wPath);

                        log.warn(`  => ${event} ${_wPath} `);

                        if (event.endsWith('Dir') || (_wPath.endsWith('package.json')))
                            checkWorkspacesJson(true);

                        const found = findWorkspace(_wPath);

                        if (found) {
                            let toBuild = [];
                            toBuild = addToBuild(toBuild, found);
                            log.important(`  => build ${toBuild.join(', ')}`);
                        } 
                    });
                });


            srcWatchers.set(_path, _srcWatcher);
        }
    });

    srcWatchers.forEach((_watcher, _path) => {
        if (!workspaces.includes(_path)) {
            _watcher.close().then(() => {
                log.info(`Stop watching ${_path}`);
            });
            srcWatchers.delete(_path);
        }
    });
}

const findWorkspace = (_path) => {
    let found = null;
    const extPath = path.dirname(_path);
    for (const [, wk] of packages.entries()) {
        if (extPath.startsWith(wk.path)) {
            found = wk;
            break;
        }
    }
    return found;
};

function addToBuild(toBuild, wk) {
    if (toBuild.indexOf(wk.name) >= 0)
        toBuild = toBuild.filter(dep => dep !== wk.name);

    toBuild.push(wk.name);

    if (wk.usedBy)
        wk.usedBy.forEach(w => toBuild = addToBuild(toBuild, packages.get(w)));

    return toBuild;
}

//#endregion

//#region utility functions

function argsChanged(oldArgs, newArgs) {
    return (
        !oldArgs ||
        oldArgs.length !== newArgs.length ||
        newArgs.some((arg, index) => arg !== oldArgs[index])
    );
}

//#endregion
