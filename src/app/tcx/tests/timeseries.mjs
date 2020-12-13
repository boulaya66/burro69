'use strict';

/**
 * Time series post processing
 */

/**
 * Base class
 */
class _series {
    constructor() {
        this._result = 0.0;
    }
    result(precision) {
        if (precision === undefined)
            return this._result;
        return toDigits(this._result, precision);
    }
    next() { }
    end(precision = 2) {
        return this.result(precision);
    }
    toString() {
        return this.result(0).toString();
    }
}

/**
 * Standard Mean of time series
 */
class MEAN extends _series {
    constructor(discardZero = false) {
        super();
        this.total = 0.0;
        this.count = 0.0;
        this.discardZero = discardZero;
    }
    next(value) {
        if (this.discardZero && value * 1.0 === 0.0)
            return;
        this.count++;
        this.total += value;
    }
    end(precision = 2) {
        this._result = this.total / this.count;
        return super.end(precision);
    }
}

/**
 * Simple Moving Average
 */
class SMA extends _series {
    constructor(smoothing, power) {
        super();
        this.smoothing = smoothing;
        this.power = power;
        this.values = [];
        this.count = 1 - smoothing;
        this.prev = 0.0;
        this.total = 0.0;
    }
    next(value) {
        this.count++;
        this.values.push(value);
        this.prev += value;
        if (this.values.length >= this.smoothing) {
            this.total += Math.pow(this.prev / this.smoothing, this.power);
            this.prev -= this.values.shift();
        }
    }
    end(precision = 2) {
        this._result = Math.pow(this.total / this.count, 1 / this.power);
        return super.end(precision);
    }
}

/**
 * Max of a time series
 */
class MMAX extends _series {
    constructor(smoothing) {
        super();
        this.smoothing = smoothing;
        this.values = [];
        this.prev = 0.0;
    }
    next(value) {
        this.values.push(value);
        this.prev += value;
        if (this.values.length >= this.smoothing) {
            if (this.prev / this.smoothing > this._result)
                this._result = this.prev / this.smoothing;
            this.prev -= this.values.shift();
        }
    }
}

/**
 * Min of a time series
 */
class MMIN extends _series {
    constructor(smoothing) {
        super();
        this.smoothing = smoothing;
        this.values = [];
        this.prev = 0.0;
        this._result = undefined;
    }
    next(value) {
        if (this._result === undefined)
            this._result = value;
        this.values.push(value);
        this.prev += value;
        if (this.values.length >= this.smoothing) {
            if (this.prev / this.smoothing < this._result)
                this._result = this.prev / this.smoothing;
            this.prev -= this.values.shift();
        }
    }
}

/**
 * Count time series measures / range
 */
class RANGE extends _series {
    constructor(...args) {
        super();
        this._result = [];
        this.limits = args;
        for (let i = 0; i <= this.limits.length; i++)
            this._result[i] = 0;
    }
    next(value) {
        for (let i = 0; i < this.limits.length; i++) {
            if (value <= this.limits[i]) {
                this._result[i] = this._result[i] + 1;
                break;
            }
        }
        if (value > this.limits[this.limits.length - 1])
            this._result[this.limits.length] = this._result[this.limits.length] + 1;
    }
    result(precision) {
        if (precision === undefined)
            return this._result;
        return this._result.map(range => toDigits(range, precision));
    }
}

/**
 * Exponential Weighted Moving Average
 */
class EWMA extends _series {
    constructor(smoothing, power) {
        super();
        this.alpha = 1 / (smoothing + 1);
        this.power = power;
        this.count = 0;
        this.prev = 0.0;
        this.total = 0.0;
    }
    next(value) {
        this.count++;
        this.prev += (value - this.prev) * this.alpha;
        this.total += Math.pow(this.prev, this.power);
    }
    end(precision = 2) {
        this._result = Math.pow(this.total / this.count, 1 / this.power);
        return super.end(precision);
    }
}

/**
 * function toDigits
 * @param value 
 * @param digits 
 */
function toDigits(value, digits = 2) {
    const factor = Math.pow(10, digits);
    return Math.round(factor * value) / factor;
}

/**
 * function linearRegression
 * @param y 
 * @param x 
 */
function linearRegression(y, x) {
    var lr = {};
    var n = y.length;
    var sumX = 0;
    var sumY = 0;
    var sumXY = 0;
    var sumXX = 0;
    var sumYY = 0;

    for (var i = 0; i < y.length; i++) {

        sumX += x[i];
        sumY += y[i];
        sumXY += (x[i] * y[i]);
        sumXX += (x[i] * x[i]);
        sumYY += (y[i] * y[i]);
    }

    lr['slope'] = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    lr['intercept'] = (sumY - lr.slope * sumX) / n;
    lr['r2'] = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)), 2);

    return lr;
}

/**
 * export clause
 */
export {
    MMAX,
    MMIN,
    MEAN,
    SMA,
    EWMA,
    RANGE,
    toDigits,
    linearRegression
};

//___EOF___ Time series
