'use strict';

import RL from 'readline';
import os from 'os';
import fs from 'fs';
import chalk from 'chalk';
import upath from 'upath';
import path from 'path';
import createCommand, { runSteps } from './createcommand';
import { isString, invokeOrReturn } from '@burro69/helpers';
import { findWorkspace, readWorkspaces } from '../lib/workspaces';
import { log } from '@burro69/logger';
import { execYarn } from '../lib/yarn';


export default (prog) => {
    const runConsole = createCommand(_console, prog);

    prog
        .command('console', '', { alias: ['cli'] })
        .describe(`Creates a console interface for wk cli commands.`)
        .example('console')
        .example('cli')
        .action(runConsole);
};

/**
 * Internal implementation
 */
const inputStream = process.stdin;
const outputStream = process.stdout;
const completions = [];

function _console(options) {
    let run = runSteps('wk console');

    run.addStep(consoleStep1, 'Install readline interface.');
    run.addStep(consoleStep2, 'Add common listeners.');
    run.addStep(consoleStep3, 'Add common cli commands.');
    run.addStep(consoleStep4, 'Add yarn commands.');
    run.addStep(consoleStep5, 'Add wk commands.');
    run.addStep(consoleStep6, 'Initial prompt.');

    run(0, options);

    log.setLogger();
}

const consoleStep1 = (context) => {
    const rl = RL.createInterface({
        input: inputStream,
        output: outputStream,
        prompt: getPrompt(),
        completer: completer
    });

    const _prompt = rl.prompt;

    rl.prompt = () => {
        _prompt.call(rl);
        rl.cursor = rl.line.length;
        const _len = unEscapeChars(rl._prompt).length;
        RL.cursorTo(outputStream, rl.line.length + _len);
    };

    rl.clearScreen = () => {
        RL.cursorTo(outputStream, 0, 0);
        RL.clearScreenDown(outputStream);
        rl.prompt();
    };

    rl.log = (...args) => {
        RL.clearLine(outputStream, 0);
        if (args && typeof args[0] === 'string')
            console.log('\r' + args[0], ...args.slice(1));
        else
            console.log('\r', ...args);
        rl.prompt();
    };

    rl.addCompletion = (cmd, params = [], handler) => {
        completions.push({ cmd, params, handler });
        completions.sort((a, b) => a.cmd.localeCompare(b.cmd));
        return rl;
    };

    Object.defineProperty(rl, 'completions', {
        get: () => completions
    });

    log.setLogger(rl.log);

    context.rl = rl;
};

const consoleStep2 = (context) => {
    const rl = context.rl;

    rl
        .on('close', () => {
            log.setLogger();
            log.important('exiting console...');
            process.exit(0);
        })
        .on('line', line => {
            const args = line.split(' ').filter(arg => !!arg);
            line = args.shift() || '';

            const _cmd = rl.completions.find(c => c.cmd === line);
            if (_cmd && _cmd.handler) {
                _cmd.handler(args);
                rl.prompt();
                return;
            }

            rl.log(`Unknown command "${line}"`);
        });
};

const consoleStep3 = (context) => {
    const rl = context.rl;
    const prog = context.prog;

    prog
        .command('quit', 'Exit from wk readline interface', { alias: 'exit' })
        .example('quit').example('exit')
        .action(() => { rl.close() });
    prog
        .command('cls', 'clear the terminal screen', { alias: ['clrscr', 'clear'] })
        .example('cls').example('clrscr')
        .action(() => { rl.clearScreen() });
    prog
        .command('whoami', 'Print the user name associated with the current effective user ID')
        .example('whoami')
        .action(() => { rl.log(`${os.userInfo().username}`) });
    prog
        .command('host', 'Hostname is used to display the system\'s DNS name', { alias: 'hostname' })
        .example('host')
        .action(() => { rl.log(`${os.hostname()}`) });
    prog
        .command('md <dir>', 'Create the <dir>ectory, if it does not already exist.', { alias: 'mkdir' })
        .option('$completer', 'hidden completer option', completepath)
        .example('mkdir src/lib')
        .action((dir) => {
            let _path = upath.normalizeSafe(dir);
            fs.mkdirSync(_path, { recursive: true });
        });
    prog
        .command('mf <file>', 'create a new file.', { alias: ['touch', 'mkfile'] })
        .option('$completer', 'hidden completer option', completepath)
        .example('touch src/lib/index.js')
        .action((file) => {
            let _path = upath.normalizeSafe(file);
            let _file = upath.parse(_path);
            if (!fs.existsSync(_file.dir))
                fs.mkdirSync(_file.dir, { recursive: true });
            if (!fs.existsSync(_path))
                fs.writeFileSync(_path, '\n\n');
        });
    prog
        .command('cd <dir>', 'Change the shell working directory.', { alias: ['chdir'] })
        .option('$completer', 'hidden completer option', completepath)
        .example('cd ~').example('cd ..').example('chdir src/lib')
        .action((dir) => {
            if (dir)
                dir = dir.replace(/~+/, originalCwd);
            else
                dir = '';
            let _path = upath.normalizeSafe(upath.isAbsolute(dir) ? dir : upath.joinSafe(process.cwd(), dir || ''));
            if (_path.startsWith(originalCwd)) {
                try {
                    process.chdir(_path);
                } catch (error) {
                    rl.log(chalk.red.bold`Error ${error}`);
                }
            } else {
                rl.log(chalk.bold.red`Going out the repo ${originalCwd} is not allowed within wk cli.`);
            }
            rl.setPrompt(getPrompt());
        });
    prog
        .command('ll [dir]', 'Create the <dir>ectory, if it does not already exist.', { alias: ['ls', 'dir'] })
        .option('$completer', 'hidden completer option', completepath)
        .option('--recursive, -r', 'Recursive dir list', false)
        .example('ll src/lib')
        .action(function listDir(dir, options) {
            if (dir)
                dir = upath.normalizeSafe(dir);
            else
                dir = '.';
            const files = fs.readdirSync(dir, { withFileTypes: true });
            files.sort((a, b) => {
                if (a.isDirectory() && !b.isDirectory())
                    return -1;
                if (b.isDirectory())
                    return 1;
                return a.name.localeCompare(b.name);
            });
            log.info(`dir ${dir}`);
            log('Mode', 'Last Write Time'.padEnd(22), 'Size (b)'.padStart(12), 'Name');
            log('----', '---------------'.padEnd(22), '--------'.padStart(12), '----');
            files.forEach(f => {
                const stat = fs.statSync(upath.joinSafe(dir, f.name));
                const cFile = f.isSymbolicLink() ? chalk.magenta : (f.isDirectory() ? chalk.green : chalk.white);
                log('0' + (stat.mode & parseInt('777', 8)).toString(8),
                    chalk.white(stat.mtime.toLocaleString('fr-FR', {}).padEnd(22)),
                    chalk.white`${(f.isFile() ? Math.trunc(stat.size).toString() : ' ').padStart(12)}`,
                    cFile(f.name));
            });
            if (options.recursive) {
                files.forEach(f => {
                    if (f.isDirectory()) {
                        listDir(upath.joinSafe(dir, f.name), options);
                        log('');
                    }
                });
            }
        });
    //TODO: rmdir
    //TODO: del
    // TODO: fs cmds to external file
};

const consoleStep4 = (context) => {
    const prog = context.prog;

    prog
        .command('install', 'Install all the dependencies listed within package.json.')
        .example('install')
        .action(() => {
            log.info('yarn install');
            execYarn('install');
        });
    prog
        .command('yadd [..pakages]', 'yarn add command.')
        .option('-W', 'required to run yarn add inside a workspace root', false)
        .option('--dev, -D', 'will install one or more packages in your devDependencies', false)
        .option('--peer, -P', 'will install one or more packages in your peerDependencies', false)
        .example('yadd -WD package')
        .action(createCommand((args) => {
            if (!args.packages.length)
                return;
            log.info('yarn add');
            let options = ['add']
                .concat(args.packages)
                .concat(args.W ? ['-W'] : [])
                .concat(args.D ? ['-D'] : [])
                .concat(args.P ? ['-P'] : []);
            try {
                execYarn(...options);
            } catch (error) {
                log.error(`${error}`);
            }
        }, prog)
            //.extractOption('command')
            .concatOption('packages')
        );
    prog
        .command('yremove [..pakages]', 'yarn remove command.', { alias: ['yrm'] })
        .option('-W', 'required to run yarn add inside a workspace root', false)
        .example('yremove -W package')
        .action(createCommand((args) => {
            if (!args.packages.length)
                return;
            log.info('yarn remove');
            let options = ['remove']
                .concat(args.packages)
                .concat(args.W ? ['-W'] : []);
            try {
                execYarn(...options);
            } catch (error) {
                log.error(`${error}`);
            }
        }, prog)
            //.extractOption('command')
            .concatOption('packages')
        );
    prog
        .command('yinfo', 'yarn workspaces info command.')
        .example('yinfo')
        .action(() => {
            log.info('yarn workspaces info');
            execYarn('workspaces', 'info');
        });
    prog
        .command('outdated', 'yarn outdated command.')
        .example('outdated')
        .action(() => {
            log.info('yarn outdated');
            execYarn('outdated');
        });
    prog
        .command('check', 'yarn check command.')
        .example('check')
        .action(() => {
            log.info('yarn check');
            execYarn('check');
        });

    //TODO: yarn cmoomands to external file
    // yarn workspace add/remove/run
    // yarn info
    // yarn upgrade
    // yarn run

};

const consoleStep5 = (context) => {
    const rl = context.rl;
    const prog = context.prog;
    const hiddenCmds = ['cli', 'console'];
    //TODO: watch
    //TODO: finish build
    prog
        .command('winfo', 'wk workspaces info command.', { alias: 'info' })
        .example('winfo')
        .action(() => {
            log.info('wk workspaces info');
            const workspaces = readWorkspaces();
            console.dir(workspaces, { colors: true, depth: Infinity });
        });

    Object.keys(prog[prog.default]).forEach(key => {
        if (key.startsWith('__') || hiddenCmds.includes(key))
            return;
        let cmd = prog[prog.default][key];
        if (isString(cmd))
            cmd = prog[prog.default][cmd];
        let options = ['--help', '-h'];
        if (cmd.default['$completer']) {
            options = cmd.default['$completer'];
        } else {
            cmd.options.forEach(opt => {
                if (opt[0].startsWith('--$completer'))
                    return;
                options = options.concat(opt[0].split(', '));
            });

            options = options.sort((a, b) => a.replaceAll('-', '').localeCompare(b.replaceAll('-', '')));
        }
        rl.addCompletion(key, options, (args) => {
            const _cmd = `${key} ${args.join(' ')}`;
            try {
                prog.cli(_cmd);
            } catch (error) {
                log.error(`${error}`);
            }
        });
    });

    rl.addCompletion('help', Object.keys(prog[prog.default]).filter(key => !key.startsWith('__')), (args) => {
        const _cmd = args.join(' ') + ' --help';
        prog.cli(_cmd);
    });

};

const consoleStep6 = (context) => {
    log.success(`Install a readline interface for wk commands.`);

    context.rl.prompt();
};

/**
 * utility functions
 */
let
    originalCwd = upath.normalizeSafe(process.cwd()),
    mainRepo = originalCwd.split('/').pop();

const unEscapeChars = (s) => s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

const getPrompt = () => {
    const wk = findWorkspace(upath.normalizeSafe(upath.relative(originalCwd, process.cwd()) + '/*'));

    let _path = wk ? chalk.cyan('w:' + wk.name) : chalk.yellow('./' + upath.relative(originalCwd, process.cwd()));
    return chalk.bold.magenta`${chalk.yellow(mainRepo)}[${_path}]>`;
};

function completer(line) {
    const _completions = completions.map(a => a.cmd);
    const _args = line.split(' ').filter(arg => !!arg);
    if (line.endsWith(' '))
        _args.push(' ');
    let hits = [];

    if (_args.length === 1) {
        hits = _completions.filter((c) => c.startsWith(line));
    } else if (_args.length > 1) {
        const _cmd = completions.find(c => c.cmd === _args[0]);
        if (_cmd) {
            const _params = invokeOrReturn(_cmd.params, ..._args.slice(-1));
            hits = _params.filter(p => p.startsWith(_args.slice(-1)));
            if (hits.length) {
                _args.pop();
                hits = hits.map(h => _args.join(' ') + ' ' + h);
            } else {
                hits = _params;
            }
        }
    } else {
        hits = _completions;
    }

    return [hits, line];
}

function completepath(arg) {
    let _args = (arg ? arg.split('/') : []);
    _args.pop();
    const _path = path.join(process.cwd(), ..._args);
    const res = ['..', '~'];

    try {
        const dirents = fs.readdirSync(_path, { withFileTypes: true });
        dirents.forEach(dirent => {
            if (dirent.isDirectory())
                res.push(_args.concat(dirent.name).join('/'));
        });

    } catch (error) {
        //
    }
    return res;
}

// ___EOF___
