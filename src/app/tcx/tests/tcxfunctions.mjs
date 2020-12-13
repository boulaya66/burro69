'use strict';

/**
 * Import internal dependencies
 */
import { readTCX, writeTCX } from './tcxfiles.mjs';
import { SMA, toDigits, MEAN, EWMA, MMAX, MMIN, linearRegression, RANGE } from './timeseries.mjs';
import { dateToString } from './dateformat.mjs';
import { log } from '@burro69/logger';

/**
 * TCX post processing functions
 */

// TODO: import => estimate power
// TODO: add parameters: FCMax, FCRest, FCLT,hrzones, pwzones, men/female
const FCMax = 182;
const FCRest = 60;
const FCLT = 162;


//#region exported commands
/**
 * function combineTCX
 * @param src 
 * @param dst 
 */
async function combineTCX(src, dst) {
    function _combineTCX(obj1, obj2) {
        const
            laps1 = obj1.Lap,
            laps2 = obj2.Lap,
            dist1 = laps1[laps1.length - 1].Track.Trackpoint[laps1[laps1.length - 1].Track.Trackpoint.length - 1].DistanceMeters,
            dist2 = laps2[0].Track.Trackpoint[0].DistanceMeters,
            offset = dist1 + 1 - dist2;

        laps2.forEach(lap => {
            lap.Track.Trackpoint.forEach(point => {
                point.DistanceMeters = 1.0 * point.DistanceMeters + offset;
            });
        });

        obj1.Lap = [].concat(laps1, laps2);

        return obj1;
    }

    log.info(`Combine "${src.join(', ')}" and save in ${dst}`);
    let res;
    for (let path of src) {
        const data = await readTCX(path);
        if (!res)
            res = data;
        else
            res = _combineTCX(res, data);
    }

    await writeTCX(res, dst);
}

/**
 * function markTCX
 * @param src 
 * @param dist 
 * @param dest 
 */
async function markTCX(src, offset, isTime, dest) {
    log.info(`Mark a lap in  ${src} at  ${offset} ${isTime ? 's' : 'm'} and save in ${dest}`);
    const data = await readTCX(src);

    const newlaps = splitActivity(data.Activity, offset, isTime);
    if (newlaps) {
        data.Lap = newlaps.flat();
        await writeTCX(data, dest);
    } else {
        log.error(`Offset ${offset} ${isTime ? 's' : 'm'} is out of activity bounds.`);
    }
}

/**
 * function splitTCX
 * @param src 
 * @param offset 
 * @param dest1 
 * @param dest2 
 */
async function splitTCX(src, offset, isTime, dest1, dest2) {
    log.info(`Split ${src} at ${offset} ${isTime ? 's' : 'm'} and save in ${dest1},${dest2}`);
    const data = await readTCX(src);

    const newlaps = splitActivity(data.Activity, offset, isTime);
    if (newlaps) {
        data.Lap = newlaps[0];
        await writeTCX(data, dest1);

        data.Lap = newlaps[1];
        data.Activity.Id = newlaps[1][0].Track.Trackpoint[0].Time;
        await writeTCX(data, dest2);
    } else {
        log.error(`Offset ${offset} ${isTime ? 's' : 'm'} is out of activity bounds.`);
    }
}

/**
 * function truncTCX
 * @param src 
 * @param offset 
 * @param isTime 
 * @param dest 
 */
async function truncTCX(src, offset, isTime, dest) {
    log.info(`Trunc ${src} at ${offset} ${isTime ? 's' : 'm'} and save in ${dest}`);
    const data = await readTCX(src);

    const newlaps = splitActivity(data.Activity, offset, isTime);
    if (newlaps) {
        data.Lap = newlaps[0];
        await writeTCX(data, dest);
    } else {
        log.error(`Offset ${offset} ${isTime ? 's' : 'm'} is out of activity bounds.`);
    }
}

/**
 * function getMetrics
 * @param src 
 * @param ftp 
 * @param smoothing 
 */
// TODO: add export option
async function getMetrics(src, ftp, smoothing) {
    // read fila
    log.info(`Post-analyze ${src} with FTP=${ftp} and smoothing factor ${smoothing}...`);
    const data = await readTCX(src);
    let laps = data.Lap;

    // get general info
    const Point0 = laps[0].Track.Trackpoint[0];
    let isPower = (Point0.Extensions);
    let isSpeed = (Point0.Extensions);
    let tcxPrefix = '';
    let powerPrefix = '';
    let speedPrefix = '';
    if (isPower) {
        tcxPrefix = Object.keys(Point0.Extensions)[0];
        powerPrefix = tcxPrefix.split(':').length > 1 ? tcxPrefix.split(':')[0] + ':Watts' : 'Watts';
        speedPrefix = tcxPrefix.split(':').length > 1 ? tcxPrefix.split(':')[0] + ':Speed' : 'Speed';
        isPower = (powerPrefix in Point0.Extensions[tcxPrefix]);
        isSpeed = (speedPrefix in Point0.Extensions[tcxPrefix]);
    }

    // start stats
    let totalTime = 0;
    let totalDist = 0;
    let NP = new SMA(smoothing, 4);
    let xPower = new EWMA(smoothing, 4);
    let mPower = new MEAN();
    let mHR = new MEAN();
    let mCadence = new MEAN(true);
    let maxHR = new MMAX(1);
    let maxCadence = new MMAX(1);
    let maxPower = new MMAX(1);
    let maxSpeed = new MMAX(1);
    let xHR = new EWMA(smoothing, 4);
    let CP_5 = new MMAX(5);
    let CP_30 = new MMAX(30);
    let CP1 = new MMAX(60);
    let CP3 = new MMAX(3 * 60);
    let CP5 = new MMAX(5 * 60);
    let CP10 = new MMAX(10 * 60);
    let CP20 = new MMAX(20 * 60);
    let CP30 = new MMAX(30 * 60);
    let CP60 = new MMAX(60 * 60);
    let CP120 = new MMAX(120 * 60);
    let CP180 = new MMAX(180 * 60);
    let hrZones = new RANGE(107, 141, 159, 176);
    let pwZones = new RANGE(116, 159, 190, 222, 254, 318);
    let altMax = new MMAX(1);
    let altMin = new MMIN(1);
    let maxSlope = new MMAX(1);

    // Slope ->
    let first = true;
    let prevAlt = 0.0;
    let prevDist = 0.0;
    let prevIndex = 0;
    let mEPower = new MEAN();
    let maxEPower = new MMAX(1);
    let estimations = 0;
    let error = 0;
    // <- Slope

    // collect
    laps.forEach(lap => {
        totalTime += parseInt(lap.TotalTimeSeconds);
        totalDist += parseInt(lap.DistanceMeters);
        const track = lap.Track.Trackpoint;
        track.forEach((point, index) => {
            const power = isPower ? parseInt(point.Extensions[tcxPrefix][powerPrefix]) : 0.0;
            const speed = isSpeed ? parseInt(point.Extensions[tcxPrefix][speedPrefix]) : 0.0;
            const hr = point.HeartRateBpm ? parseInt(point.HeartRateBpm.Value) : 0;
            const cadence = point.Cadence ? parseInt(point.Cadence) : 0;
            const altitude = point.AltitudeMeters ? 1.0 * (point.AltitudeMeters) : 0.0;
            // Slope ->
            let slopeAlt = 0.0;
            if (first) {
                first = false;
            } else if (altitude !== prevAlt && point.DistanceMeters * 1.0 - prevDist > 0) {
                slopeAlt = 100 * (altitude - prevAlt) / (point.DistanceMeters * 1.0 - prevDist);
                if (slopeAlt > 30)
                    slopeAlt = 0.0;
                else
                    maxSlope.next(slopeAlt);

                let ePower = 0.0;
                let adjSpeed = (point.DistanceMeters * 1.0 - prevDist) / (index - prevIndex);
                let pWa = 0.5 * 1.2 * 0.5 * Math.pow(adjSpeed, 3);
                let pWf = 0.012 * (68) * 9.81 * adjSpeed;
                let pWp = adjSpeed * (68) * 9.81 * slopeAlt / 100;
                ePower = pWa + pWf + pWp;
                if (slopeAlt >= -1) {
                    mEPower.next(ePower);
                    maxEPower.next(ePower);
                    estimations++;
                    error += Math.pow(ePower - power, 2);
                }
                prevAlt = altitude;
                prevDist = point.DistanceMeters * 1.0;
                prevIndex = index;
            }
            // <- Slope
            NP.next(power);
            xPower.next(power);
            mPower.next(power);
            mHR.next(hr);
            mCadence.next(cadence);
            maxHR.next(hr);
            maxCadence.next(cadence);
            maxPower.next(power);
            maxSpeed.next(speed);
            xHR.next(hr);
            hrZones.next(hr);
            pwZones.next(power);
            CP_5.next(power);
            CP_30.next(power);
            CP1.next(power);
            CP3.next(power);
            CP5.next(power);
            CP10.next(power);
            CP20.next(power);
            CP30.next(power);
            CP60.next(power);
            CP120.next(power);
            CP180.next(power);
            altMax.next(altitude);
            altMin.next(altitude);
        });
    });

    // finalize stats
    mPower.end();
    NP.end();
    xPower.end();
    mHR.end();
    xHR.end();
    mCadence.end();

    mEPower.end();
    error = Math.pow(error, 0.5) / estimations;

    // create metrics
    let TSS = totalTime * Math.pow(NP.result() / ftp, 2) / 36;
    let CPs = [maxPower, CP_5, CP_30, CP1, CP3, CP5, CP10, CP20, CP30, CP60, CP120, CP180], xx = [], yy = [];
    CPs.forEach(c => {
        if (c.result() > 0) {
            xx.push(c.smoothing);
            yy.push(c.result() * c.smoothing);
        }
    });
    let LR = linearRegression(yy, xx);
    let AWC = LR.intercept;
    let CP = LR.slope;
    let BikeScore = totalTime * Math.pow(xPower.result() / CP, 2) / 36;
    let BikeScoreFtp = totalTime * Math.pow(xPower.result() / ftp, 2) / 36;
    let HRR = (mHR.result() - FCRest) / (FCMax - FCRest);
    let LTHRR = (FCLT - FCRest) / (FCMax - FCRest);
    let TRIMP = totalTime / 60 * HRR * 0.64 * Math.exp(1.92 * HRR);
    let LTTRIMP = 60 * LTHRR * 0.64 * Math.exp(1.92 * LTHRR);
    let HRSS = 100 * TRIMP / LTTRIMP;
    let HRSS2 = totalTime * Math.pow(HRR, 2) / 36;
    let xHRR = (xHR.result() - FCRest) / (FCMax - FCRest);
    let xTRIMP = totalTime / 60 * xHRR * 0.64 * Math.exp(1.92 * xHRR);

    let startPoint = laps[0].Track.Trackpoint[0];
    let endPoint = laps[laps.length - 1].Track.Trackpoint[laps[laps.length - 1].Track.Trackpoint.length - 1];
    let startAlt = startPoint.AltitudeMeters ? startPoint.AltitudeMeters * 1.0 : 0.0;
    let endAlt = endPoint.AltitudeMeters ? endPoint.AltitudeMeters * 1.0 : 0.0;
    let avgSlope = 100 * (endAlt - startAlt) / totalDist;

    // gather metrics
    return {
        main: {
            Start: dateToString(Point0.Time),
            Time: totalTime,
            FC: mHR.result(0),
            FCMax: FCMax,
            FCRest: FCRest,
            FCLT: FCLT,
            FTP: 1.0 * ftp,
            Power: mPower.result(0),
            NP: NP.result(0),
            xPower: xPower.result(0),
            CP: toDigits(CP, 0),
            TSS: toDigits(TSS, 0),
            BikeScore: toDigits(BikeScore, 0),
            BikeScoreFtp: toDigits(BikeScoreFtp, 0),
            HRSS: toDigits(HRSS, 0),
            HRSS2: toDigits(HRSS2, 0),
            TRIMP: toDigits(TRIMP, 0),
            xTRIMP: toDigits(xTRIMP, 0),
        },
        inputs: {
            FCMax: FCMax,
            FCRest: FCRest,
            FCLT: FCLT,
            FTP: 1.0 * ftp,
        },
        activity: {
            StartTime: dateToString(Point0.Time),
            TotalTimeSeconds: totalTime,
            DistanceMeters: totalDist,
            AverageHeartRateBpm: mHR.result(0),
            MaximumHeartRateBpm: maxHR.result(0),
            AverageCadence: mCadence.result(0),
            MaximumCadence: maxCadence.result(0),
            AveragePower: mPower.result(0),
            MaximumPower: maxPower.result(0),
            AverageSpeed: toDigits(totalDist / totalTime),
            MaximumSpeed: maxSpeed.result(2),
            StartAltitude: toDigits(startAlt, 0),
            MinimumAltitude: altMin.result(0),
            MaximumAltitude: altMax.result(0),
            EndAltitude: toDigits(endAlt, 0),
            MaximumSlope: maxSlope.result(1),
            AverageSlope: toDigits(avgSlope, 1),
            AvgEstimadPower: mEPower.result(0),
            MaxEstimatedPower: maxEPower.result(0),
            EstimatedErrors: toDigits(error, 2)
        },
        coggan: {
            FTP: 1.0 * ftp,
            NP: NP.result(0),
            TSS: toDigits(TSS, 0),
            IF: toDigits(NP.result() / ftp, 2),
            IV: toDigits(NP.result() / mPower.result(), 2)
        },
        skiba: {
            CP: toDigits(CP, 0),
            xPower: xPower.result(0),
            IF: toDigits(xPower.result() / CP, 2),
            IV: toDigits(xPower.result() / mPower.result(), 2),
            BikeScoreCP: toDigits(BikeScore, 0),
            BikeScoreFTP: toDigits(BikeScoreFtp, 0),
        },
        trimp: {
            FC: mHR.result(0),
            HRR: toDigits(HRR, 2),
            TRIMP: toDigits(TRIMP, 0),
            HRSS: toDigits(HRSS, 0),
            IF_: toDigits(HRR / LTHRR, 2),
            HRSS2: toDigits(HRSS2, 0),
        },
        cp: {
            CP_1: toDigits(maxPower, 0),
            CP_5: toDigits(CP_5, 0),
            CP_30: toDigits(CP_30, 0),
            CP1: toDigits(CP1, 0),
            CP3: toDigits(CP3, 0),
            CP5: toDigits(CP5, 0),
            CP10: toDigits(CP10, 0),
            CP20: toDigits(CP20, 0),
            CP30: toDigits(CP30, 0),
            CP60: toDigits(CP60, 0),
            CP120: toDigits(CP120, 0),
            CP180: toDigits(CP180, 0),
            AWC: toDigits(AWC, 0),
            CP: toDigits(CP, 0),
            WP: Math.round(36 * (ftp - CP)),
        },
        xtrimp: {
            xHR: xHR.result(0),
            xHRR: toDigits(xHRR, 2),
            xTRIMP: toDigits(xTRIMP, 0),
        },
        hrzones: {
            Z1: hrZones.result(0)[0],
            Z2: hrZones.result(0)[1],
            Z3: hrZones.result(0)[2],
            Z4: hrZones.result(0)[3],
            Z5: hrZones.result(0)[4]
        },
        powerzones: {
            Z1: pwZones.result(0)[0],
            Z2: pwZones.result(0)[1],
            Z3: pwZones.result(0)[2],
            Z4: pwZones.result(0)[3],
            Z5: pwZones.result(0)[4],
            Z6: pwZones.result(0)[5],
            Z7: pwZones.result(0)[6]
        }
    };
}

/**
 * function importTCX
 * @param src 
 * @param dst 
 * @param opts 
 */
async function importTCX(src, dst, opts) {
    // recurse src file ->
    let srcLapIndex = 0;
    let srcPointIndex = opts.offset - 1;
    let srcLaps, dstLaps;
    let srcTrack, dstTrack;
    function srcNext() {
        srcPointIndex++;
        if (!srcTrack)
            srcTrack = getLapTrack(srcLaps[srcLapIndex]);
        if (srcPointIndex >= srcTrack.length) {
            srcLapIndex++;
            if (srcLapIndex >= srcLaps.length)
                return null;
            srcPointIndex = 0;
            srcTrack = getLapTrack(srcLaps[srcLapIndex]);
        }
        let point = srcTrack[srcPointIndex];
        return point;
    }
    // <- recurse src file

    const hr = opts.hr;
    const gpx = opts.gpx;
    const cadence = opts.cadence;
    const speed = opts.speed;
    const power = opts.power;
    const running = opts.running;

    log.info(`Import "${hr ? 'hr ' : ''}${gpx ? 'gpx' : ''}${cadence ? 'cad' : ''}" from <${src}> into <${dst}> and save in <${opts.output}>`);

    const srcData = await readTCX(src);
    const dstData = await readTCX(dst);
    srcLaps = srcData.Lap;
    dstLaps = dstData.Lap;

    let totalDist = 0;
    dstLaps.forEach(dstLap => {
        const lExt = dstLap.Extensions;
        const pExt = dstLap.Track.Trackpoint[0].Extensions;
        const lExtension = lExt ? Object.keys(lExt)[0] : '';
        const lprefix = lExtension.split(':').length > 1 ? lExtension.split(':')[0] + ':' : '';
        const pExtension = pExt ? Object.keys(pExt)[0] : '';
        const pPrefix = pExtension.split(':').length > 1 ? pExtension.split(':')[0] + ':' : '';

        dstTrack = getLapTrack(dstLap);
        let mHR = new MEAN();
        let maxHR = new MMAX(1);
        let mCadence = new MEAN();
        let maxCadence = new MMAX(1);
        let mSpeed = new MEAN();
        let maxSpeed = new MMAX(1);
        let mPower = new MEAN();
        let maxPower = new MMAX(1);
        let mRunning = new MEAN();
        let maxRunning = new MMAX(1);
        let lapDist = 0;
        dstTrack.forEach((point) => {
            const srcPoint = srcNext();
            if (!srcPoint) {
                if (gpx)
                    point.DistanceMeters = lapDist;
                return;
            }
            if (hr && srcPoint.HeartRateBpm) {
                point.HeartRateBpm = srcPoint.HeartRateBpm;
                let value = parseInt(srcPoint.HeartRateBpm.Value);
                mHR.next(value);
                maxHR.next(value);
            }
            if (cadence && srcPoint.Cadence) {
                point.Cadence = srcPoint.Cadence;
                let value = parseInt(srcPoint.Cadence);
                mCadence.next(value);
                maxCadence.next(value);
            }
            if (gpx) {
                if (srcPoint.DistanceMeters) {
                    point.DistanceMeters = srcPoint.DistanceMeters;
                    lapDist = 1.0 * (srcPoint.DistanceMeters) - totalDist;
                }
                if (srcPoint.Position)
                    point.Position = srcPoint.Position;
                if (srcPoint.AltitudeMeters)
                    point.AltitudeMeters = srcPoint.AltitudeMeters;
            }
            if (point.Extensions) {
                const rec = point.Extensions[pExtension];
                if (speed && rec[pPrefix + 'Speed']) {
                    let value = 1.0 * rec[pPrefix + 'Speed'];
                    mSpeed.next(value);
                    maxSpeed.next(value);
                }
                if (power && rec[pPrefix + 'Watts']) {
                    let value = parseInt(rec[pPrefix + 'Watts']);
                    mPower.next(value);
                    maxPower.next(value);
                }
                if (running && rec[pPrefix + 'RunCadence']) {
                    let value = parseInt(rec[pPrefix + 'RunCadence']);
                    mRunning.next(value);
                    maxRunning.next(value);
                }

            }
        });
        mHR.end();
        mCadence.end();
        mSpeed.end();
        mPower.end();
        mRunning.end();

        if (hr) {
            dstLap.AverageHeartRateBpm = { Value: mHR.result(0) };
            dstLap.MaximumHeartRateBpm = { Value: maxHR.result(0) };
        }
        if (gpx) {
            dstLap.DistanceMeters = parseInt(lapDist);
            totalDist += lapDist;
        }
        if (cadence) {
            dstLap.Cadence = mCadence.result(0);
            if (lExt) {
                const rec = dstLap.Extensions[lExtension];
                rec[lprefix + 'MaxBikeCadence'] = maxCadence.result(0);
            }
        }
        if (speed) {
            dstLap.MaximumSpeed = maxSpeed.result(5);
            if (lExt) {
                const rec = dstLap.Extensions[lExtension];
                rec[lprefix + 'AvgSpeed'] = mSpeed.result(5);
            }

        }
        if (power) {
            if (lExt) {
                const rec = dstLap.Extensions[lExtension];
                rec[lprefix + 'AvgWatts'] = mPower.result(5);
                rec[lprefix + 'MaxWatts'] = maxPower.result(0);
            }

        }
        if (running) {
            if (lExt) {
                const rec = dstLap.Extensions[lExtension];
                rec[lprefix + 'AvgRunCadence'] = mRunning.result(5);
                rec[lprefix + 'MaxRunCadence'] = maxRunning.result(5);
            }

        }
    });

    await writeTCX(dstData, opts.output);
}

/**
 * function removeTCX
 * @param src 
 * @param dst 
 * @param opts 
 */
async function removeTCX(src, opts) {
    if (opts.all) {
        opts.hr = true;
        opts.speed = true;
        opts.power = true;
        opts.cadence = true;
    }
    const out = opts.output;
    log.info(`Remove selected sensors from <${src}> and save in <${out}>`);

    const dataSrc = await readTCX(src);

    dataSrc.Lap.forEach(lap => {
        if (opts.hr) {
            delete lap.AverageHeartRateBpm;
            delete lap.MaximumHeartRateBpm;
        }
        if (opts.cadence)
            delete lap.Cadence;
        if (opts.speed)
            delete lap.MaximumSpeed;

        delete lap.Calories;

        const trackSrc = getLapTrack(lap);

        let extension = '';
        let prefix = '';
        if (trackSrc[0].Extensions) {
            extension = Object.keys(trackSrc[0].Extensions)[0];
            prefix = extension.split(':').length > 1 ?
                extension.split(':')[0] + ':' :
                '';
        }

        trackSrc.forEach((point) => {
            if (opts.hr)
                delete point.HeartRateBpm;
            if (opts.cadence)
                delete point.Cadence;
            if (point.Extensions) {
                if (opts.speed)
                    delete point.Extensions[extension][prefix + 'Speed'];
                if (opts.power)
                    delete point.Extensions[extension][prefix + 'Watts'];
            }
        });
    });

    await writeTCX(dataSrc, out);
}

/**
 * function showTCX
 * @param src 
 */
async function showTCX(src) {
    // read fila
    log.info(`Show activity in ${src}...`);
    const data = await readTCX(src);
    log.success(`TCX from ${data.Author.Name}`);
    showActivity(data.Activity);
}

/**
 * function copyTCX
 * @param src 
 * @param dst 
 */
async function copyTCX(src, dst) {
    log.info(`Copy  <${src}> in <${dst}>`);

    const data = await readTCX(src);
    await writeTCX(data, dst);
}

//#endregion

export {
    combineTCX,
    markTCX,
    splitTCX,
    getMetrics,
    showTCX,
    importTCX,
    removeTCX,
    truncTCX,
    copyTCX
};

/**
 * Internal functions
 */

//#region get functions
function getActivityTotals(activity) {
    let totalTime = 0, totalDist = 0;

    activity.Lap.forEach(lap => {
        totalTime += parseInt(lap.TotalTimeSeconds);
        if (lap.DistanceMeters)
            totalDist += parseInt(lap.DistanceMeters);
    });

    return [totalTime, totalDist];
}

function getLapTrack(lap) {
    return lap?.Track?.Trackpoint;
}

function getPointOffset(activity, offset, isTime) {
    const [totalTime, totalDist] = getActivityTotals(activity);
    if (isTime && totalTime <= offset)
        return [-1, -1];
    if (!isTime && totalDist <= offset)
        return [-1, -1];

    let laps = activity.Lap;
    let totalOffset = 0;
    let lapIndex = -1;
    let pointIndex = -1;
    if (isTime) {
        laps.every((lap, index) => {
            if (totalOffset + parseInt(lap.TotalTimeSeconds) > offset) {
                lapIndex = index;
                pointIndex = offset - totalOffset - 1;
                return false;
            }
            totalOffset += parseInt(lap.TotalTimeSeconds);
            return true;
        });
    } else {
        laps.every((lap, index) => {
            if (totalOffset + parseInt(lap.DistanceMeters) > offset) {
                lapIndex = index;
                pointIndex = lap.Track.Trackpoint.findIndex((p) => {
                    return parseInt(p.DistanceMeters) > offset;
                });
                return false;
            }
            totalOffset += parseInt(lap.DistanceMeters);
            return true;
        });
    }

    return [lapIndex, pointIndex];
}
//#endregion

//#region show
function showActivity(activity) {
    log(`  Sport     : ${activity['$'].Sport}`);
    log(`  StartTime : ${(new Date(activity.Id)).toLocaleString('fr-FR')}`);
    log(`  Creator   : ${activity.Creator?.Name ?? ''}`);
    log(`  Notes     : ${activity.Notes ?? '-'}`);
    log(`  Training  : ${activity.Training?.Plan?.Name ?? '-'}`);
    let laps = activity.Lap;
    log.important(`Contains ${laps.length} lap(s)`);
    laps.forEach((lap, index) => {
        log.success(`  Lap ${index}:`);
        showLap(lap);
    });
}

function showLap(lap) {
    log(`    StartTime : ${(new Date(lap['$'].StartTime)).toLocaleString('fr-FR')}`);
    log(`    Total Time: ${parseInt(lap.TotalTimeSeconds)} s`);
    if (lap.DistanceMeters)
        log(`    Distance  : ${parseInt(lap.DistanceMeters)} m`);
    if (lap.MaximumSpeed)
        log(`    Max speed : ${parseInt(lap.MaximumSpeed)} m/s (${parseInt(lap.MaximumSpeed) * 3.6} km/h)`);
    if (lap.Calories)
        log(`    Calories  : ${parseInt(lap.Calories)}`);
    if (lap.AverageHeartRateBpm)
        log(`    avg HR    : ${parseInt(lap.AverageHeartRateBpm.Value)}`);
    if (lap.MaximumHeartRateBpm)
        log(`    max HR    : ${parseInt(lap.MaximumHeartRateBpm.Value)}`);
    if (lap.Cadence)
        log(`    Cadence   : ${parseInt(lap.Cadence)}`);
    log(`    Intensity : ${lap.Intensity}`);
    log(`    Method    : ${lap.TriggerMethod}`);
    log(`    Notes     : ${lap.Notes ?? '-'}`);
    if (lap.Extensions) {
        // <xsd:element name="LX" type="ActivityLapExtension_t"/>
        const extension = Object.keys(lap.Extensions)[0];
        const prefix = extension.split(':').length > 1 ?
            extension.split(':')[0] + ':' :
            '';
        log('    Extensions:');
        const rec = lap.Extensions[extension];
        log(`      avg Speed   : ${toDigits(rec[prefix + 'AvgSpeed'] || 0, 2)}`);
        log(`      max Cadence : ${parseInt(rec[prefix + 'MaxBikeCadence'] || 0)}`);
        log(`      avg run cad.: ${parseInt(rec[prefix + 'AvgRunCadence'] || 0)}`);
        log(`      max run cad.: ${parseInt(rec[prefix + 'MaxRunCadence'] || 0)}`);
        log(`      Steps       : ${parseInt(rec[prefix + 'Steps'] || 0)}`);
        log(`      avg Power   : ${parseInt(rec[prefix + 'AvgWatts'] || 0)}`);
        log(`      max Power   : ${parseInt(rec[prefix + 'MaxWatts'] || 0)}`);
    }
    log.warn(`    Track : ${lap.Track.Trackpoint.length} points`);
    let first = true;
    let prev;
    let inactive = 0;
    lap.Track.Trackpoint.forEach(point => {
        if (first) {
            first = false;
            prev = new Date(point.Time.replace(/\.[0-9]{3}Z/, '.000Z'));
            return;
        }
        let curr = new Date(point.Time.replace(/\.[0-9]{3}Z/, '.000Z'));
        let diff = Math.floor((curr - prev) / 1000);
        inactive += diff - 1;
        prev = curr;
    });
    log(`      Inactive    : ${inactive} s`);
    showPoint(lap.Track.Trackpoint[0]);
    log.warn('      ...');
    showPoint(lap.Track.Trackpoint[lap.Track.Trackpoint.length - 1]);
}

function showPoint(point) {
    point.Time = point.Time.replace(/\.[0-9]{3}Z/, '.000Z');
    log.important(`      Time : ${point.Time}`);
    log(`        Date      : ${(new Date(point.Time)).toLocaleString('fr-FR')}`);
    if (point.Position)
        log(`        Position  : Lat=${toDigits(point.Position.LatitudeDegrees, 4)} Lng=${toDigits(point.Position.LongitudeDegrees, 4)}`);
    if (point.AltitudeMeters)
        log(`        Altitude  : ${parseInt(point.AltitudeMeters)} m`);
    if (point.DistanceMeters)
        log(`        Distance  : ${parseInt(point.DistanceMeters)} m`);
    if (point.HeartRateBpm)
        log(`        Heart Rate: ${parseInt(point.HeartRateBpm.Value)} bpm`);
    if (point.Cadence)
        log(`        Cadence   : ${parseInt(point.Cadence)} rpm`);
    if (point.Extensions) {
        // <xsd:complexType name="ActivityTrackpointExtension_t">
        const extension = Object.keys(point.Extensions)[0];
        const prefix = extension.split(':').length > 1 ?
            extension.split(':')[0] + ':' :
            '';
        const rec = point.Extensions[extension];
        log(`        Speed      : ${toDigits(rec[prefix + 'Speed'] || 0, 2)} m/s`);
        log(`        Power      : ${parseInt(rec[prefix + 'Watts'] || 0)} W`);
        log(`        Run cadence: ${parseInt(rec[prefix + 'RunCadence'] || 0)} W`);
    }
}
//#endregion

//#region split
function adjustLap(lap) {
    const track = getLapTrack(lap);
    const first = track[0];
    const last = track[track.length - 1];
    const lExt = lap.Extensions;
    const pExt = first.Extensions;
    const lExtension = lExt ? Object.keys(lExt)[0] : '';
    const lprefix = lExtension.split(':').length > 1 ? lExtension.split(':')[0] + ':' : '';
    const pExtension = pExt ? Object.keys(pExt)[0] : '';
    const pPrefix = pExtension.split(':').length > 1 ? pExtension.split(':')[0] + ':' : '';

    lap['$'].StartTime = first.Time;
    lap.TotalTimeSeconds = ((Date.parse(last.Time) - Date.parse(first.Time)) / 1000).toString();
    lap.DistanceMeters = parseInt(last.DistanceMeters) - parseInt(first.DistanceMeters);

    let mHR = new MEAN();
    let maxHR = new MMAX(1);
    let mCadence = new MEAN();
    let maxCadence = new MMAX(1);
    let mSpeed = new MEAN();
    let maxSpeed = new MMAX(1);
    let mPower = new MEAN();
    let maxPower = new MMAX(1);
    let mRun = new MEAN();
    let maxRun = new MMAX(1);
    track.forEach(point => {
        if (point.HeartRateBpm) {
            let hr = parseInt(point.HeartRateBpm.Value);
            mHR.next(hr);
            maxHR.next(hr);
        }
        if (point.Cadence) {
            let cadence = parseInt(point.Cadence);
            mCadence.next(cadence);
            maxCadence.next(cadence);
        }
        if (point.Extensions) {
            const rec = point.Extensions[pExtension];
            if (rec[pPrefix + 'Speed']) {
                let speed = 1.0 * (rec[pPrefix + 'Speed']);
                mSpeed.next(speed);
                maxSpeed.next(speed);
            }
            if (rec[pPrefix + 'Watts']) {
                let power = parseInt(rec[pPrefix + 'Watts']);
                mPower.next(power);
                maxPower.next(power);
            }
            if (rec[pPrefix + 'RunCadence']) {
                let run = parseInt(rec[pPrefix + 'RunCadence']);
                mRun.next(run);
                maxRun.next(run);
            }
        }
    });
    mHR.end();
    mCadence.end();
    mSpeed.end();
    mPower.end();
    mRun.end();

    lap.AverageHeartRateBpm = { Value: mHR.result(0) };
    lap.MaximumHeartRateBpm = { Value: maxHR.result(0) };
    lap.MaximumSpeed = maxSpeed.result(5);
    lap.Cadence = mCadence.result(0);
    if (lExt) {
        const rec = lap.Extensions[lExtension];
        rec[lprefix + 'MaxBikeCadence'] = maxCadence.result(0);
        rec[lprefix + 'AvgSpeed'] = mSpeed.result(5);
        rec[lprefix + 'AvgWatts'] = mPower.result(0);
        rec[lprefix + 'MaxWatts'] = maxPower.result(0);
        rec[lprefix + 'AvgRunCadence'] = mRun.result(0);
        rec[lprefix + 'MaxRunCadence'] = maxRun.result(0);
    }

    return lap;
}

function splitLap(lap, index) {
    log.info(`Split lap at ${(new Date(lap.Track.Trackpoint[index].Time)).toLocaleString('fr-FR')}`);
    log.warn('Lap to split:');
    showLap(lap);

    let lap1 = {
        '$': {},
        Calories: Math.trunc(lap.Calories / 2).toString(),
        Intensity: lap.Intensity,
        TriggerMethod: lap.TriggerMethod,
        Track: {
            Trackpoint: lap.Track.Trackpoint.slice(0, index)
        }
    };
    if (lap.Extensions) {
        let key = Object.keys(lap.Extensions)[0];
        lap1.Extensions = {};
        lap1.Extensions[key] = {};
    }
    lap1 = adjustLap(lap1);

    let lap2 = {
        '$': {},
        Calories: Math.trunc(lap.Calories / 2).toString(),
        Intensity: lap.Intensity,
        TriggerMethod: lap.TriggerMethod,
        Track: {
            Trackpoint: lap.Track.Trackpoint.slice(index)
        }
    };
    if (lap.Extensions) {
        let key = Object.keys(lap.Extensions)[0];
        lap2.Extensions = {};
        lap2.Extensions[key] = {};
    }
    lap2 = adjustLap(lap2);

    log.success('=> Lap 1:');
    showLap(lap1);

    log.success('=> Lap 2:');
    showLap(lap2);

    return [lap1, lap2];
}

function splitActivity(activity, offset, isTime) {
    const [lapIndex, pointIndex] = getPointOffset(activity, offset, isTime);

    let laps = activity.Lap;

    if (lapIndex >= 0 && pointIndex >= 0) {
        const newLaps = splitLap(laps[lapIndex], pointIndex);

        let laps1 = [];
        for (let i = 0; i < lapIndex; i++)
            laps1.push(laps[i]);
        laps1.push(newLaps[0]);

        let laps2 = [];
        laps2.push(newLaps[1]);
        for (let i = lapIndex + 1; i < laps.length; i++)
            laps2.push(laps[i]);

        return [laps1, laps2];
    }

    return null;
}
//#endregion

//___EOF___ TCX functions
