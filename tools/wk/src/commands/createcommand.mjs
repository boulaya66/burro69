'uses strict';

import { log } from '@burro69/logger';

export default function createCommand(run, prog) {
    const _fns = [];
    /*    
    const _prog = prog;
            
    const _commands = (cmd, options = {}) => {
            if (!_prog || !_prog.default)
                return;
            if (_prog[_prog.default][cmd]?.handler?.run) {
                options.prog = _commands;
                _prog[_prog.default][cmd].handler.run(options);
            }
        };
     */
    const _command = (...args) => {
        const options = args.slice(-1)[0];
        options.prog = prog;
        _fns.reduce((acc, fn) => fn(acc, options), args);
        return run(options);
    };

    _command.concatOption = (key) => {
        _fns.push((args, options) => {
            const value = args[0];
            options[key] = (value ? [value] : []).concat(options._);
            args = args.slice(1);
            return args;
        });
        return _command;
    };

    _command.extractOption = (key) => {
        _fns.push((args, options) => {
            const value = args[0];
            options[key] = value;
            args = args.slice(1);
            return args;
        });
        return _command;
    };

    _command.arrayifyOption = (key) => {
        _fns.push((args, options) => {
            options[key] = options[key] ? options[key].split(',') : [];
            return args;
        });
        return _command;
    };

    _command.run = run;

    return _command;
}

export function runSteps(cmd = '') {
    const _steps = [];
    let _currStep = 0;

    const _run = (start = 0, context = {}) => {
        cmd && log.info(`Run ${cmd}`);
        _currStep = start;

        context.skip = (by = 1) => {
            for (let i = 1; i <= by; i++)
                log(`${cmd ? cmd + ' ' : ''}[${_currStep + i + 1}/${_steps.length}] skipped (${_steps[_currStep].desc})`);
            _currStep += by + 1;
        };

        context.end = () => {
            log(`${cmd ? cmd + ' ' : ''}[${_currStep + 2}...${_steps.length}] skip to end`);
            _currStep = -1;
        };

        while (_currStep >= 0 && _currStep < _steps.length) {
            log(`${cmd ? cmd + ' ' : ''}[${_currStep + 1}/${_steps.length}] ${_steps[_currStep].desc}`);

            const prevStep = _currStep;
            _steps[_currStep].step(context);

            if (prevStep === _currStep)
                _currStep++;
        }
    };

    _run.addStep = (step, desc = '') => _steps.push({ step, desc });

    return _run;
}

// ___EOF___