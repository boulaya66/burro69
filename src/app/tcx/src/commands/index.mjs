/**
 * import local commands
 */
import cmdCombine from './cmdCombine.mjs';
import cmdMark from './cmdMark.mjs';
import cmdTrunc from './cmdTrunc.mjs';
import cmdSplit from './cmdSplit.mjs';
import cmdHelp from './cmdHelp.mjs';
import cmdList from './cmdList.mjs';
import cmdMetrics from './cmdMetrics.mjs';
import cmdShow from './cmdShow.mjs';
import cmdAllMetrics from './cmdAll.mjs';
import cmdCopy from './cmdCopy.mjs';
import cmdImport from './cmdImport.mjs';
import cmdRemove from './cmdRemove.mjs';

/**
 * @file tcx app: commands/index.mjs
 * 
 * Collect and export all commands
 * @memberof module:tcx
 * @export cmdAllMetrics
 * @export cmdCombine
 * @export cmdCopy
 * @export cmdHelp
 * @export cmdImport
 * @export cmdList
 * @export cmdMark
 * @export cmdMetrics
 * @namespace tcx/commands
 */

export default [
    cmdCombine,
    cmdMark,
    cmdTrunc,
    cmdSplit,
    cmdHelp,
    cmdList,
    cmdMetrics,
    cmdShow,
    cmdAllMetrics,
    cmdCopy,
    cmdImport,
    cmdRemove
];