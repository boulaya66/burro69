/**
 * jsb app: lib/microbundle.mjs
 */
import { log } from '@burro69/logger';
//import _microbundle from '@fork/microbundle';

// internal flag
let imported;
async function dynamicImport() {
    if (!imported) {
        log.warn('loading microbundle ...');
        imported = (await import('@fork/microbundle')).default;
    }
    return imported;
}

/**
 * Internal wrapper for @fork/microbundle
 * @param {object} opts - The options to pass to microbundle fork
 * @return {void}
 */
export default async function microbundle(opts) {
    let _microbundle = await dynamicImport();
    await _microbundle(opts)
        .then(({ output }) => {
            // eslint-disable-next-line eqeqeq
            if (output != null) log(output);
        })
        .catch(err => {
            log.error(err);
        });
}

//___EOF___
