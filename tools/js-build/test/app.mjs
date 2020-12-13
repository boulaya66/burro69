import { log } from '@burro69/logger';

export function cliApp(src, opts) {
    opts.prog._version();
    log.warn('this is the entry of the cli app');
    delete(opts.prog);
    console.dir(opts, { colors: true, depth: Infinity });
}

//___EOF___
