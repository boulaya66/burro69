'use strict';


const { getPackageJson } = require('@burro69/helpers');

/* 
try {
    await tasks.run()
} catch (error) {
    console.log(error)
} */
const pkg = getPackageJson(import.meta.url);

console.log(`${pkg.name} v${pkg.version} running in ${process.cwd()}`);
