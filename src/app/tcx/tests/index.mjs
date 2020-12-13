#!/usr/bin/env node

/**
 * import node.js builins
 */
import { writeFile, readdir } from 'fs/promises';
import path from 'path';

/**
 * Import sade.js external dependency
 */
import sade from 'sade';

/**
 * import local commands
 */
import { log } from '@burro69/logger';
import {
    combineTCX,
    markTCX,
    splitTCX,
    getMetrics,
    showTCX,
    importTCX,
    removeTCX,
    copyTCX,
    truncTCX
} from './tcxfunctions.mjs';

/**
 * CLI Prog def
 */
const prog = sade('tcx', false)
    .version('1.0.0');

prog
    .command('combine <...src>', '', { alias: ['c'] })
    .describe('Combine tcx files in one single multi-lap activity')
    .option('-o, --output', 'Change the name of the output file', 'result.tcx')
    .example('combine activity1.tcx activity2.tcx --output activity.tcx')
    .action(cmdCombine);

prog
    .command('mark <src> <offset>', '', { alias: ['m'] })
    .describe('Mark tcx file at offset (by default distance in meters), resulting in two new laps.')
    .option('-t, --time', 'Offset is a time offset (in seconds) instead of a distance.', false)
    .option('-o, --output', 'Change the name of the output file', 'result.tcx')
    .example('mark activity1.tcx 25000 --output activity.tcx')
    .action(cmdMark);

prog
    .command('trunc <src> <offset>', '', { alias: ['t'] })
    .describe('Truncate tcx file at offset (by default distance in meters).')
    .option('-t, --time', 'Offset is a time offset (in seconds) instead of a distance.', false)
    .option('-o, --output', 'Change the path and name of the output files', './result.tcx')
    .example('trunc activity.tcx -t 5270 -o output.tcx')
    .action(cmdTrunc);

prog
    .command('split <src> <offset>', '', { alias: ['s'] })
    .describe('Split tcx file at offset (by default distance in meters), resulting in two new files.')
    .option('-t, --time', 'Offset is a time offset (in seconds) instead of a distance.', false)
    .option('-o, --output', 'Change the path and name of the output files', './result.tcx')
    .example('split activity1.tcx 25000')
    .action(cmdSplit);

prog
    .command('metrics <src> <FTP>', '', { alias: [] })
    .describe('Get metrics from <src> (power metrics based on <FTP>).')
    .option('-s, --smoothing', 'Smoothing factor', 25)
    .option('-m, --metrics', 'Select metrics (comma separated or all).', 'all')
    .example('metrics activity1.tcx 216 -s 30')
    .action(cmdMetrics);

prog
    .command('all <src> <FTP>', '', { alias: ['a'] })
    .describe('Get metrics from src/*.tcx (power metrics based on <FTP>).')
    .option('-s, --smoothing', 'Smoothing factor', 25)
    .option('-m, --metrics', 'Select metrics (comma separated or all).', 'main')
    .option('-o, --output', 'Change the path and name of the output files', './metrics.txt')
    .example('all ./data 216 -s 25')
    .action(cmdAllMetrics);

prog
    .command('show <src>', '', { alias: ['v'] })
    .describe('Show information from tcx')
    .example('show activity1.tcx')
    .action(cmdShow);

prog
    .command('import <src> <dst>', '', { alias: ['i'] })
    .describe('Import sensors from <src> into <dst> and save in <output>.')
    .option('--hr', 'Import heart rate sensor values.', false)
    .option('--gpx', 'Import distance, position and altitude values.', false)
    .option('--cadence', 'Import cadence sensor values.', false)
    .option('--speed', 'Import speed sensor values.', false)
    .option('--power', 'Import power sensor values.', false)
    .option('--running', 'Import running cadence sensor values.', false)
    .option('--offset', 'Set a time offset on src track data.', 0)
    .option('-o, --output', 'Change the path and name of the output files', './result.tcx')
    .example('import hr.tcx activity.tcx --hr -o merged.tcx')
    .action(cmdImport);

    
prog
    .command('remove <src>', '', { alias: ['r'] })
    .describe('Remove sensors from <src> into <dst> and save in <output>.')
    .option('--hr', 'Remove heart rate sensor values.', false)
    .option('-s --speed', 'Remove speed sensor values.', false)
    .option('-p --power', 'Remove power sensor values.', false)
    .option('-c, --cadence', 'Remove cadence sensor values.', false)
    .option('--all', 'Remove all sensor values.', false)
    .option('--offset', 'Set an offset on src track data', 0)
    .option('-o, --output', 'Change the path and name of the output files', './result.tcx')
    .example('import activity.tcx --hr -o removed.tcx')
    .action(cmdRemove);

prog
    .command('help [cmd]', '', { alias: ['h'] })
    .describe('Show tcx full help.')
    .example('help')
    .example('help list')
    .action(cmdHelp);

prog
    .command('list', '', { alias: ['l'] })
    .describe('List tcx available commands.')
    .example('list')
    .action(cmdList);

prog
    .command('copy <src> <dst>', '', { alias: [] })
    .describe('Copy tcx file.')
    .example('copy activity.tcx activity1.tcx')
    .action(cmdCopy);

/**
 * Main entry point
 */
prog.parse(process.argv);

/**
 * Internal commands implementation
 */

async function cmdCombine(src, opts) {
    src = [].concat(src, opts._);
    try {
        await combineTCX(src, opts.output);
    } catch (error) {
        log.error(error);
    }
}

async function cmdMark(src, offset, opts) {
    try {
        const dest = path.parse(opts.output);
        const isTime = opts.time;
        await markTCX(src, offset, isTime, dest);
    } catch (error) {
        log.error(error);
    }
}

async function cmdSplit(src, offset, opts) {
    try {
        const dest = path.parse(opts.output);
        const dest1 = path.join(dest.dir, dest.name + '-1' + dest.ext);
        const dest2 = path.join(dest.dir, dest.name + '-2' + dest.ext);
        const isTime = opts.time;
        await splitTCX(src, offset, isTime, dest1, dest2);

    } catch (error) {
        log.error(error);
    }
}

async function cmdTrunc(src, offset, opts) {
    try {
        const dest = path.parse(opts.output);
        const isTime = opts.time;
        await truncTCX(src, offset, isTime, dest);

    } catch (error) {
        log.error(error);
    }
}

async function cmdShow(src) {
    try {
        await showTCX(src);
    } catch (error) {
        log.error(error);
    }
}

async function cmdMetrics(src, ftp, opts) {
    const metrics = opts.metrics.split(',');
    try {
        let res = await getMetrics(src, ftp, opts.smoothing);
        if (metrics.indexOf('all') < 0) {
            res = metrics.reduce((acc, key) => {
                acc[key] = res[key];
                return acc;
            }, {});
        }
        log(res);
    } catch (error) {
        log.error(error);
    }
}

async function cmdAllMetrics(src, ftp, opts) {
    try {
        let metrics = opts.metrics.split(',');
        let content = '';
        let first = true;
        let files = await readdir(src, { withFileTypes: true });
        for (let i = 0; i < files.length; i++) {
            let f = files[i];
            if (f.isFile())
                log.info(`Analysing ${f.name}...`);
            else
                continue;

            let res = await getMetrics(path.join(src, f.name), ftp, opts.smoothing);
            if (res) {
                if (metrics.indexOf('all') >= 0)
                    metrics = Object.keys(res);
                res = metrics.reduce((acc, key) => ({ ...acc, ...res[key] }), {});
                if (first) {
                    content += ['FileName'].concat(Object.keys(res)).join(';') + '\n';
                    first = false;
                }
                content += [f.name].concat(Object.values(res)).join(';') + '\n';
            }
        }

        await writeFile(opts.output, content);

    } catch (error) {
        log.error(error);
    }
}

async function cmdImport(src, dst, opts) {
    try {
        await importTCX(src, dst, opts);
    } catch (error) {
        log.error(error);
    }
}

async function cmdRemove(src, opts) {
    try {
        await removeTCX(src, opts);
    } catch (error) {
        log.error(error);
    }
}

async function cmdHelp(cmd) {
    if (cmd) {
        prog.help(cmd);
        return;
    }
    const commands = new Map();
    Object.keys(prog.tree).sort().forEach(key => {
        if (!key.startsWith('_') && typeof prog.tree[key] === 'object')
            commands.set(key, prog.tree[key]);
    });
    log.info(`${prog.bin} full help`);
    for (const [key, value] of commands) {
        log.info(`\n${key.padEnd(10)} (${value.alibi.join(', ')})`);
        log(`  ${truncString(value.describe, 60, true)}`);
        log(`  Usage: tcx ${value.usage} ${value.options.length ? `[Options]` : ''}`);
        if (value.options.length) {
            log.warn(`  Options:`);
            value.options.forEach(option => log(`    ${option[0].padEnd(14)} ${truncString(option[1], 40, true)} [default ${option[2]}]`));
        }
    }
}

async function cmdList() {
    const commands = new Map();
    Object.keys(prog.tree).sort().forEach(key => {
        if (!key.startsWith('_') && typeof prog.tree[key] === 'object')
            commands.set(key, prog.tree[key]);
    });
    log.info(`tcx command list :`);
    for (const [key, value] of commands)
        log(`  ${key.padEnd(10)} ${value.alibi.join(', ').padEnd(4)} ${truncString(value.describe, 70, true)}`);
}

async function cmdCopy(src, dst) {
    try {
        await copyTCX(src, dst);
    } catch (error) {
        log.error(error);
    }
}



function truncString(str, num, pad = false) {
    if (!(typeof str === 'string'))
        str = str.toString();
    if (str.length <= num)
        return pad ? str.padEnd(num) : str;

    return str.slice(0, num - 3) + '...';
}

//___EOF___
