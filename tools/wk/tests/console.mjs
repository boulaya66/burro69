import RL from 'readline';
import os from 'os';
import fs from 'fs';
import chalk from 'chalk';
import upath from 'upath';
import path from 'path';
import prog from '../src/commands/prog';
import { isString, invokeOrReturn } from '@burro69/helpers';
import { findWorkspace } from '../src/lib/workspaces';

let
    originalCwd = upath.normalizeSafe(process.cwd()),
    mainRepo = originalCwd.split('/').pop();

const unEscapeChars = (s) => s.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
const getPrompt = () => {
    const wk = findWorkspace(upath.normalizeSafe(upath.relative(originalCwd, process.cwd()) + '/*'));

    //const _path = upath.relative(originalCwd + '/..', upath.normalizeSafe(process.cwd()));

    let __path = wk ? chalk.cyan('w:' + wk.name) : chalk.yellow('./' + upath.relative(originalCwd, process.cwd()));
    return chalk.bold.magenta`${chalk.yellow(mainRepo)}[${__path}]>`;

    //return chalk.bold.magenta`${chalk.yellow(_path)}[${chalk.cyan(wk ? wk.name : 'main')}]>`
};

const createConsole = (options = {}) => {
    const inputStream = process.stdin;
    const outputStream = process.stdout;
    const completions = [];

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

    const defaultOptions = {
        input: inputStream,
        output: outputStream,
        prompt: getPrompt(),
        completer: completer
    };

    Object.assign(defaultOptions, options);

    const _rl = RL.createInterface(defaultOptions);

    const _prompt = _rl.prompt;

    _rl.prompt = () => {
        _prompt.call(_rl);
        _rl.cursor = _rl.line.length;
        const _len = unEscapeChars(_rl._prompt).length;
        RL.cursorTo(outputStream, _rl.line.length + _len);
    };

    _rl.clearScreen = (_rl) => {
        RL.cursorTo(outputStream, 0, 0);
        RL.clearScreenDown(outputStream);
        _rl.prompt();
    };

    _rl.log = (...args) => {
        RL.clearLine(outputStream, 0);
        if (args && typeof args[0] === 'string')
            console.log('\r' + args[0], ...args.slice(1));
        else
            console.log('\r', ...args);
        _rl.prompt();
    };

    _rl.addCompletion = (cmd, params = [], handler) => {
        completions.push({ cmd, params, handler });
        completions.sort((a, b) => a.cmd.localeCompare(b.cmd));
        return _rl;
    };

    Object.defineProperty(_rl, 'completions', {
        get: () => completions
    });

    return _rl;
};

const rl = createConsole()
    .addCompletion('quit', [], () => {
        rl.close();
    })
    .addCompletion('cls', [], () => {
        rl.clearScreen(rl);
    })
    .addCompletion('whoami', [], () => {
        rl.log(`${os.userInfo().username}`);
    })
    .addCompletion('host', [], () => {
        rl.log(`${os.hostname()}`);
    })
    .addCompletion('md', completepath, (args) => {
        if (args[0]) {
            let _path = upath.normalizeSafe(args[0]);
            fs.mkdirSync(_path, { recursive: true });
        }
    })
    .addCompletion('mf', completepath, (args) => {
        if (args[0]) {
            let _path = upath.normalizeSafe(args[0]);
            let file = upath.parse(_path);
            if (!fs.existsSync(file.dir))
                fs.mkdirSync(file.dir, { recursive: true });
            if (!fs.existsSync(_path))
                fs.writeFileSync(_path, '\n\n');
        }
    })
    .addCompletion('cd', completepath, (args) => {
        if (args[0])
            args[0] = args[0].replace(/~+/, originalCwd);
        else
            args.push('');
        let _path = upath.normalizeSafe(upath.isAbsolute(args[0]) ? args[0] : upath.joinSafe(process.cwd(), args[0] || ''));
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
    })
    .on('close', () => {
        // do stuff
        console.log('exiting console...');
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

Object.keys(prog[prog.default]).forEach(key => {
    if (key.startsWith('__'))
        return;
    let cmd = prog[prog.default][key];
    if (isString(cmd))
        cmd = prog[prog.default][cmd];
    let options = ['--help', '-h'];
    cmd.options.forEach(opt => options = options.concat(opt[0].split(', ')));
    options = options.sort((a, b) => a.replaceAll('-', '').localeCompare(b.replaceAll('-', '')));
    rl.addCompletion(key, options, (args) => {
        const _cmd = `${key} ${args.join(' ')}`;
        prog.cli(_cmd);
    });
});

rl.addCompletion('help', Object.keys(prog[prog.default]).filter(key => !key.startsWith('__')), (args) => {
    const _cmd = args.join(' ') + ' --help';
    prog.cli(_cmd);
});

rl.prompt();


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


