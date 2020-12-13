console.log('---------------------------------------------------')

//import * as Bundle from '@xpreact/bundle';

import * as Bundle from '../packages/preact-bundle/dist/xpreact.mjs'

console.group(`NAMED (${Object.keys(Bundle).length})`);
for (const key in Bundle) {
    console.group(key);
    for (const k in Bundle[key])
        console.log(k);
    console.groupEnd();
}
console.groupEnd();

console.log('---------------------------------------------------')

/*__ EOF __ */