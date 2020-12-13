'use strict';

import { spawnSync } from 'child_process';
import { log } from '@burro69/logger';

export const execYarn = (...args) => {
    console.log(...args);
    const spawn = spawnSync('yarn', args || [], { stdio: 'inherit', shell: true });
    if (spawn.stderr)
        log.error(`${spawn.stderr}`);
    if (spawn.stdout)
        log(`${spawn.stdout}`);
};

export const yarnInit = () => execYarn('init');

export const yarnInstall = () => execYarn('install');

// ___EOF___
