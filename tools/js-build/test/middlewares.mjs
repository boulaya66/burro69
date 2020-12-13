import fs from 'fs';
import {
    mergeObjects,
    toArray
} from '@burro69/helpers';

/**
 * Sadex middleware: specific 'compress' option parsing for microbundle
 * @param {...*} args - The arguments to process
 * @return {...*} - The transformed arguments.
 */
export const compressMiddleware = (...args) => {
    const opts = args.slice(-1)[0];

    if (opts.compress !== null) {
        // Convert `--compress true/false/1/0` to booleans:
        if (typeof opts.compress !== 'boolean')
            opts.compress = opts.compress !== 'false' && opts.compress !== '0';

    } else {
        // the default compress value is `true` for web, `false` for Node:
        opts.compress = opts.target !== 'node';
    }
    return args;
};

export const buildConfigs = (...args) => {
    function isDir(name) {
        try {
            const stats = fs.statSync(name);
            return stats.isDirectory();
        } catch (error) {
            //
        }
        return false;
    }

    // process inputs
    const options = args.slice(-1)[0];

    if (!options.configs)
        return args;

    const configs = options.configs;
    const builds = [];

    for (let config of configs) {
        config.format = toArray(config.format);

        for (let f of config.format) {
            const build = mergeObjects({}, config);
            if (build.entry)
                build.entries = toArray(build.entry);
            build.config = config.config;
            build.format = f;

            if (config.output) {
                const format = (config.formats ? config.formats[f] : f);
                build.output = config.output
                    .replace('$0', config.main.dir)
                    .replace('$1', config.main.name)
                    .replace('$2', config.main.ext)
                    .replace('$3', format)
                    .replaceAll('..', '.');
            }

            if (build.output && !(isDir(build.output)))
                build['pkg-main'] = false;

            delete (build.formats);
            delete (build.main);

            builds.push(build);
        }
    }
    options.configs = builds;
    return args;
};

//___EOF___
