#!/usr/bin/env node 

/**
 * import local commands
 */
import { sadex } from '@burro69/sadex';
import cmdBundle from './commands/cmdBundle.mjs';
import cmdBuild from './commands/cmdBuild.mjs';

/**
 * jsb module: nodejs bundle tools<br>
 * @module js-build/jsb
 * @author Philippe Gensane
 * @license MIT
 */

const prog = sadex('', false);

prog
    .command(cmdBundle)
    .command(cmdBuild)
    .parse(process.argv);

//___EOF___
