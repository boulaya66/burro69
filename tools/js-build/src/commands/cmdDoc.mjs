import fs from 'fs';
import path from 'path';
import { findPackageJson, findJsonFile, strReplaceVars } from '@burro69/helpers';
import { extractSubOptions, loadConfigMiddleware } from '@burro69/sadex';
import { document } from 'js-build';

/**
 * jsb app commands/cmdDoc.mjs
 */

//#region Internal get vars
function getRoot(cwd) {
    const jsonFiles = findPackageJson(cwd);

    if (!jsonFiles.length)
        return '';

    let root = jsonFiles.find(file => {
        const manifest = JSON.parse(fs.readFileSync(file));
        return !!manifest.workspaces;
    });
    if (root)
        return path.dirname(root);

    return path.dirname(jsonFiles[jsonFiles.length - 1]);
}
function pathToUnix(str) {
    return str.split(path.sep).join(path.posix.sep);
}

function getVars(cwd) {
    let root = pathToUnix(getRoot(cwd));
    let jsonFile = findPackageJson(cwd, 1);
    jsonFile = jsonFile.length ? pathToUnix(jsonFile[0]) : '.';
    const manifest = jsonFile ? JSON.parse(fs.readFileSync(jsonFile)) : {};
    let readMe = findJsonFile(cwd, 'README.md', 1);
    readMe = readMe.length ? pathToUnix(readMe[0]) : '.';

    return {
        root: root,
        readme: readMe,
        package: jsonFile,
        dir: path.dirname(jsonFile),
        workspace: path.dirname(jsonFile),
        name: manifest?.name || '',
        version: manifest?.version || ''
    };
}
//#endregion

//#region Internal middleware implementation
/**
 * Sadex middleware: prepare bundles config to pass to jsdoc
 * @param {...*} args - The arguments to process
 * @return {...*} - The transformed arguments.
 * @private
 */
const buildConfigs = (...args) => {
    // process inputs
    const options = args.slice(-1)[0];
    const cwd = path.resolve(process.cwd(), options.cwd);
    const strVars = getVars(cwd);
    options.docVars = strVars;

    if (!options.configs)
        return args;

    const configs = options.configs;
    const bundles = [];

    // create bundle configs
    for (let config of configs) {
        let str = JSON.stringify(config);
        str = strReplaceVars(str, strVars);
        const build = JSON.parse(str);
        if (build.opts && build.opts.readme && build.opts.readme === '.')
            delete (build.opts.readme);
        if (build.opts && build.opts.package && build.opts.package === '.')
            delete (build.opts.package);
        build.docVars = strVars;
        bundles.push(build);
    }

    // return args
    options.configs = bundles;
    return args;
};
//#endregion

// internal DEFAULT jsdoc conf
const DEFAULT = {
};

/**
 * Doc command description
 */
const cmdDoc = {
    usage: 'jsdoc',
    alias: ['d'],
    describe: 'Call jsdoc with specified --cfgfile config file, --config to load options from package.json.\nAll other jsdoc options are ignored unless forced.',
    default: false,
    options: [
        ['--name', 'Specify name exposed in UMD builds'],
        ['--cwd', 'Use an alternative working directory', '.'],
        ['--config', 'Configs to load from package.json'],
        ['--cfgfile', 'External config file (alternative to package.json), if `config` is set.'],
        ['--force', 'Force other options to be processed, if `config` is set.'],
        ['--dry-run', 'Show specified configs in detail, but do not run them', false]
    ],
    categories: {
        'Input': ['name', 'cwd'],
        'Config': ['config', 'cfgfile', 'force', 'defaultConfig', 'forcedConfig', 'configs']
    },
    example: [
        'jsdoc --config',
        'jsdoc --cfgfile jsb.json'
    ],
    middlewares: [
        extractSubOptions('force'),
        loadConfigMiddleware('jsdoc', DEFAULT),
        buildConfigs
    ],
    action: document
};

export default cmdDoc;