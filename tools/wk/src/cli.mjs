#! /usr/bin/env node

import prog from './commands/prog';

/**
 * DEBUG
 */
/*
console.dir(prog, { 
    colors: true, 
    depth: Infinity, 
    showHidden: true 
});
*/

prog.parse(process.argv);

// ___EOF___
