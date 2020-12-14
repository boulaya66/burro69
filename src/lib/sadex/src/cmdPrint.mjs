//#region imports
import fs from 'fs';
import Convert from 'ansi-to-html';
import { log } from "@burro69/logger";

/**
* Import non prefixed typedefs
* - for jsdoc: this ensures that all links and types will be parsed
* - for vscode: this allows intellisense work properly with jsdoc types
*/
import './typedefs.js';
//#endregion

/**
 * memberof module:@burro69/sadex
 * file @burro69/sadex: Print optional command
 */

'use strict';

/**
 * 'print' command description (alias p)
 * 
 * Print help for each registered command.
 *
 * Usage: ```$CLI print [options]```
 * @alias printCommand
 * @memberof module:@burro69/sadex
 * @memberof @burro69/sadex
 * @constant
 * @type {SadexCommand}
 * @example $ cli print -o help.txt
 * @see {@link actPrint} for information on the handler.
 */
const cmdPrint = {
    usage: 'print',
    alias: ['p'],
    describe: 'Print help for each registered command.',
    default: false,
    options: [
        ['-m, --markdown', 'Print output in markdown format instead of html', false],
        ['-r, --readme', 'Insert document in specified readme.md at ${sadex-commands}', ''],
        ['-t, --titleLevel', 'Set the <hx> main title level.', 1],
        ['-o, --output', 'Change the path and name of the output file', './log.html']
    ],
    categories: {},
    example: [
        'print -o help.txt'
    ],
    middlewares: [],
    action: actPrint
};

export default cmdPrint;

/**
 * Internal commands implementation
 */
/**
 * The {@link printCommand} handler
 * @alias actPrint
 * @memberof module:@burro69/sadex
 * @memberof @burro69/sadex
 * @function
 * @param {Object} opts The command `print` cli options.
 * @param {Boolean} [opts.markdown=false] Print output in markdown format instead of html.
 * @param {String} [opts.readme=''] Insert document in specified readme.md at ${sadex-commands}.
 * @param {Number} [opts.titleLevel=1] Set the <hx> main title level.
 * @param {String} [opts.output='./log.html'] Change the path and name of the output file.
 */
async function actPrint(opts) {
    try {
        const { titleLevel, markdown, output, prog } = opts;
        var _stream = fs.createWriteStream(output, { flags: 'w' });
        const printCommand = createPrintCommand(_stream, prog, titleLevel, markdown);

        log.info(`Log all commands help in <${output}>`);
        log.setLogger(tmpLogger(_stream, markdown));

        if (markdown)
            _stream.write(`${'#'.repeat(titleLevel)} ${prog.bin} v${prog.ver} cli commands\n`);
        else
            _stream.write(`<h${titleLevel}>${prog.bin} v${prog.ver} cli commands</h${titleLevel}>\n`);

        const keys = Object.keys(prog.tree)
            .filter(key => !key.startsWith('_') && !(typeof prog.tree[key] === 'string'))
            .sort();

        if (markdown)
            _stream.write(keys.map(key => `- [${key}](#${key.replaceAll('.', '').replaceAll(' ', '-')})`).join('\n') + '\n\n');
        else
            _stream.write('<ul>\n' + keys.map(key => `<li><a href="#${key.replaceAll('.', '').replaceAll(' ', '-')}">${key}</a></li>`).join('\n') + '</ul>\n');

        printCommand();
        keys.forEach(key => printCommand(key));

        log.setLogger();
        _stream.end(() => {
            _stream = null;

            if (opts.readme) {
                let str = fs.readFileSync(output, {
                    encoding: 'utf8'
                });
                let me = fs.readFileSync(opts.readme, {
                    encoding: 'utf8'
                });
                me = me.replace('${sadex-commands}', str);
                fs.writeFileSync(output, me, {
                    encoding: 'utf8',
                    flag: 'w+'
                });
            }

            log.success(`tcx print done !\nCheck ${output}`);
        });
    } catch (error) {
        log.error(error);
    }
}

//#region internal implementation
var convert;

const toHtml = (arg) => arg
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const tmpLogger = (stream, markdown) => {
    if (!convert) {
        convert = new Convert({
            fg: '#FFF',
            bg: '#000',
            newline: false,
            escapeXML: false
        });
    }
    return (...args) => args.map(arg => {
        let str = convert.toHtml(markdown ? arg : toHtml(arg));
        stream.write(str + '\n');
        return str;
    });
};

const createPrintCommand = (stream, prog, level, markdown) => (cmd) => {
    if (markdown) {
        let title = '#'.repeat(level + 1);
        stream.write(`${title} ${cmd || 'cli help'}\n\n`);
        stream.write(`${toHtml(prog.tree[cmd]?.describe?.join(' ') || 'Full cli help.')}\n\n`);
        //stream.write('```sh\n');
        stream.write('<pre style="background-color:#000;color:#FFF"><code>');
    } else {
        stream.write(`<h${level + 1}  id="${(cmd || 'cli help').replaceAll('.', '').replaceAll(' ', '-')}">${cmd || 'cli help'}</h${level + 1}>`);
        stream.write(`<p>${toHtml(prog.tree[cmd]?.describe?.join(' ') || 'Full cli help.')}</p>`);
        stream.write('<pre style="background-color:#000;color:#FFF"><code>\n');
    }
    prog.help(cmd);
    if (markdown)
        stream.write('</code></pre>\n');
    else
        stream.write('\n</code></pre>\n');
};

//#endregion

//___EOF___
