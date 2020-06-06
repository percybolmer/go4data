"use strict";

/**
 * General utilities.
 */
class Util {
    static fin (callback) {
        return Util.finally(this, callback);
    }

    static promisify (fn) {
        var promise = new Promise((resolve, reject) => {
            try {
                resolve(fn());
            }
            catch (e) {
                reject(e);
            }
        });

        // There is no standard "finally" for Promises, so plop one on our
        // instances...
        promise.finally = Util.fin;

        return promise;
    }

    static pluralize (noun, qty, suffix = 's', pluralNoun) {
        return `${qty > 1 ? (!!pluralNoun ? pluralNoun : noun + suffix) : noun}`;
    }

    static capitalize (str, titleCase = false) {
        return `${str[0].toUpperCase()}${titleCase ? str.slice(1).toLowerCase() : str.slice(1)}`;
    }
}

Util.finally = function (promise, callback) {
    // We don’t invoke the callback in here,
    // because we want then() to handle its exceptions
    return promise.then(
        // Callback fulfills: pass on predecessor settlement
        // Callback rejects: pass on rejection (=omit 2nd arg.)
        value  => Promise.resolve(callback()).then(() => value),
        reason => Promise.resolve(callback()).then(() => { throw reason })
    );
};

module.exports = Util;
