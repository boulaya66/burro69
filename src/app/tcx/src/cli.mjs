#!/usr/bin/env node

/**
 * Import local commands
 */
import { sadex } from '@burro69/sadex';
/** @typedef {import('@burro69/sadex').Sadex} Sadex */
import { log } from "@burro69/logger";
import commands from "./commands/index.mjs";

/**
 * @file tcx cli app: a set of tcx file processing tools
 * @module tcx
 * @version 0.1.0
 * @author Philippe Gensane
 * @license MIT
 * 
 * @requires path
 * @requires fs/promises
 * @requires @fork/xml2js
 * @requires @burro69/sadex
 * @requires @burro69/logger
 * 
 * @todo add export option
 * @todo import => estimate power
 * @todo add parameters: FCMax, FCRest, FCLT,hrzones, pwzones, men/female
 * 
 * @example <caption>Usage: <code>tcx cmd [options]</code></caption>
 * $ tcx list
 * tcx command list :
 * all        a    Get metrics from src/*.tcx (power metrics based on <FTP>).
 * combine    c    Combine tcx files in one single multi-lap activity
 * copy       cp   Copy tcx file.
 * help       h    Show tcx full help.
 * import     i    Import sensors from <src> into <dst> and save in <output>.
 * list       l    List tcx available commands.
 * mark       m    Mark tcx file at offset (by default distance in meters).
 *                 Resulting in two new laps.
 * metrics    x    Get metrics from <src> (power metrics based on <FTP>).
 * remove     r    Remove sensors from <src> and save in <output>.
 * show       v    Show information from tcx.
 * split      s    Split tcx file at offset (by default distance in meters).
 *                 Resulting in two new files.
 * trunc      t    Truncate tcx file at offset (by default distance in meters).
 * 
 * @see {@link tcx/commands|Command list}
 * @see {@link cmdAllMetrics|all}
 * @see {@link cmdCombine|combine}
 * @see {@link cmdCopy|copy}
 * @see {@link cmdHelp|help}
 * @see {@link cmdImport|import}
 * @see {@link cmdList|list}
 * @see {@link cmdMark|mark}
 * @see {@link cmdMetrics|metrics}
 * @see {@link cmdRemove|remove}
 * @see {@link cmdShow|show}
 * @see {@link cmdSplit|split}
 * @see {@link cmdTrunc|trunc}
 */

//#region internal elapsed time
const start = process.hrtime();
function done() {
    let end = process.hrtime(start);
    end = end[0] + Math.round(end[1] / 1e6) / 1000;
    log.info('\n'+`tcx done in ${end} s.`);
}
//#endregion

/**
 * tcx app: main entry is an instance of {@link Sadex}
 * 
 * ```
 * prog
 *  //will receive all {@link module:tcx/commands|commands}
 *  .command(commands)
 *  // will parse command line
 *  .parseAsync(process.argv)
 *  // will display error or elapsed time
 *  .then(done)
 *  .catch(log.error);
 * ```
 * @instance
 * @type {Sadex} 
 */
const prog = sadex('', false);

prog
    .commands(commands)
    .parseAsync(process.argv)
    .then(done)
    .catch(log.error);

//___EOF___
