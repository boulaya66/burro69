//import * as xml from '@fork/xml2js';
import { parseStringPromise/* , Builder  */} from '@fork/xml2js';
import {readTCX} from './src/tcxfiles.mjs';

console.dir(parseStringPromise, { colors: true, depth: 1 });
console.dir(readTCX, { colors: true, depth: 1 });