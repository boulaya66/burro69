import {
    mergeObjects,
    toArray,
    strReplaceVars
} from '@burro69/helpers';
import {
    arrayifyOption,
    extractSubOptions,
    loadConfigMiddleware
} from '@burro69/sadex';
import { build } from 'js-build';

/**
 * jsb app: commands/cmdbuild.mjs
 */

//#region Internal middleware implementation
/**
 * Sadex middleware: prepare bundles config to pass to microbundle fork
 * @param {...*} args - The arguments to process
 * @return {...*} - The transformed arguments.
 * @private
 */
const buildConfigs = (...args) => {
    // process inputs
    const options = args.slice(-1)[0];

    if (!options.configs)
        return args;

    const configs = options.configs;
    const builds = [];

    // create bundle configs
    for (let config of configs) {
        config.target = toArray(config.target);

        for (let t of config.target) {
            const build = mergeObjects({}, config);
            build.config = config.config;
            build.target = t;

            if (config.output) {
                //const format = (config.formats ? config.formats[f] : f);
                build.output = strReplaceVars(config.output, {
                    name: config.name,
                    config: config.config,
                    main: config.main.name,
                    dir: config.main.dir/*,
                    bin: ''*/
                });
            }

            delete (build.main);

            builds.push(build);
        }
    }

    // return args
    options.configs = builds;
    return args;
};

//#endregion

// internal DEFAULT microbundle conf
const DEFAULT = {
    build: false,
    cwd: process.cwd(),
    target: [],
    fs: true,
    mangle: true,
    vcBuild: ["nosign", "release"],
    enableNodeCli: false,
    bundle: true,
    flags: [],
    patches: [],
    plugins: [],
    configure: [],
    make:[]
};

/**
 * Build command description
 */
const cmdBuild = {
    usage: 'build',
    alias: ['c'],
    describe: 'Builds exe file from specified entries with nexe.',
    default: false,
    options: [
        // removed ['--inputs, -i', 'Entry module(s)'],
        ['-i, --input', 'application entry point'],
        ['--output, -o', 'Directory to place build files into'],
        ['--target, -t', 'Specify your target(s) environment (windows|linux)-(x64|x86)-(node version)'],
        ['-n, --name', 'Main app module name'],
        ['-b, --build', 'build from source', false],
        ['--fake-argv', `Fake argv[1] with entry file`],
        ['--cwd', 'Use an alternative working directory', process.cwd()],
        ['--config', 'Configs to load from package.json'],
        ['--cfgfile', 'External config file (alternative to package.json), if `config` is set.'],
        ['--force', 'Force other options to be processed, if `config` is set.'],
        ['--dry-run', 'Show specified configs in detail, but do not run them', false]
    ],
    categories: {
        'Main': ['input', 'output', 'target', 'name', 'resource', 'remote', 'plugin'],
        'Config': ['config', 'cfgfile', 'force', 'defaultConfig', 'forcedConfig', 'configs'],
        'Building from source': ['build', 'python']
    },
    example: [
        'build -i dist/cli.js -o dist/cli -t windows-x64-14.5.0 --fake-argv cli.js'
    ],
    middlewares: [
        arrayifyOption('target'),
        extractSubOptions('force'),
        loadConfigMiddleware('build', DEFAULT),
        buildConfigs
    ],
    action: build
};

export default cmdBuild;

//___EOF___

/*
NEXE OPTIONS
   ${c.underline.bold('Options:')}
  -i   --input                      -- application entry point
  -o   --output                     -- path to output file
  -t   --target                     -- node version description
  -n   --name                       -- main app module name
  -r   --resource                   -- *embed files (glob) within the binary
       --remote                     -- alternate location (URL) to download pre-built base (nexe) binaries from
       --plugin                     -- extend nexe runtime behavior
   ${c.underline.bold('Building from source:')}
  -b   --build                      -- build from source
  -p   --python                     -- python2 (as python) executable path
  -f   --flag                       -- *v8 flags to include during compilation
  -c   --configure                  -- *arguments to the configure step
  -m   --make                       -- *arguments to the make/build step
       --patch                      -- module with middleware default export for adding a build patch
       --no-mangle                  -- used when generating base binaries, or when patching _third_party_main manually
       --snapshot                   -- path to a warmup snapshot
       --ico                        -- file name for alternate icon file (windows)
       --rc-*                       -- populate rc file options (windows)
       --sourceUrl                  -- pass an alternate source (node.tar.gz) url
       --enableNodeCli              -- enable node cli enforcement (blocks app cli)
   ${c.underline.bold('Other options:')}
       --bundle                     -- custom bundling module with 'createBundle' export
       --temp                       -- temp file storage default '~/.nexe'
       --cwd                        -- set the current working directory for the command
       --fake-argv                  -- fake argv[1] with entry file
       --clean                      -- force download of sources
       --silent                     -- disable logging
       --verbose                    -- set logging to verbose
*/