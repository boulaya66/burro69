'use strict';

/**
 * Import external dependencies
 */
import { parseStringPromise, Builder } from '@fork/xml2js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Import internal dependencies
 */
import { log } from '@burro69/logger';

/**
 * TCX Files read/write functions
 */

//#region read/write file
async function readTCX(src) {
    let ext = path.extname(src);
    if (ext !== '.tcx') {
        log.error('This is not a tcx file.');
        return null;
    }

    const xml = await readFile(src);
    let res = await parseStringPromise(xml, { explicitArray: false });
    if (!res.TrainingCenterDatabase?.Activities?.Activity?.Lap) {
        log.error('This file has no activity.');
        return null;
    }

    let laps = res.TrainingCenterDatabase.Activities.Activity.Lap;
    if (!Array.isArray(laps))
        res.TrainingCenterDatabase.Activities.Activity.Lap = [laps];

    Object.defineProperty(res, 'Activity', {
        enumerable: false,
        get: () => res.TrainingCenterDatabase.Activities.Activity
    });
    // use class Lap
    // get => res....Lap.map(lap => new Lap(lap));
    // set => res....Lap = laps.map(lap => (lap instanceof Lap) ? lap.lap : lap)
    Object.defineProperty(res, 'Lap', {
        enumerable: false,
        get: () => res.TrainingCenterDatabase.Activities.Activity.Lap,
        set: (laps) => { res.TrainingCenterDatabase.Activities.Activity.Lap = laps }
    });
    Object.defineProperty(res, 'Author', {
        enumerable: false,
        get: () => {
            if (!res.TrainingCenterDatabase.Author){
                res.TrainingCenterDatabase.Author = {
                    Name: 'tcx tools',
                    Build: {
                        Version: {
                            VersionMajor: 1,
                            VersionMinor: 0,
                            BuildMajor: 0,
                            BuildMinor: 0
                        }
                    },
                    LangId: 'en',
                    PartNumber: '000-00000-00'
                };
            }
            return res.TrainingCenterDatabase.Author;
        }
    });
    return res;
}

async function writeTCX(obj, dest) {
    var builder = new Builder();
    var xml = builder.buildObject(obj);

    await writeFile(dest, xml);

}
//#endregion

//#region class Lap
/*
function Lap(lap) {
    const res = {
        get lap(){
            return lap;
        },
        get Track() {
            return lap.Track.Trackpoint;
        }
    };
    return res;
}
 */
//#endregion

export {
    readTCX,
    writeTCX/*,
    Lap*/
};

//___EOF___ TCX files