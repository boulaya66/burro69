console.log('---------------------------------------------------');

//import * as Bundle from '@xpreact/bundle';

import * as helpers from '../src/index.mjs';

console.group(`NAMED (${Object.keys(helpers).length})`);
for (const key in helpers) {
    console.group(key);
    for (const k in helpers[key])
        console.log(k);
    console.groupEnd();
}
console.groupEnd();

console.log('---------------------------------------------------');

/*__ EOF __ */