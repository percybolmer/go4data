'use strict';

const ResponseFile = require('./ResponseFile');

class Arguments {
    constructor (args) {
        this._args = [];
        this._index = 0;
        this._owners = [];
        this._unpulls = [];

        this.loader = new ResponseFile();

        for (let a of args) {
            a = String(a);  // only strings
            if (a) {
                this._args.push(a);  // but no empty strings...
            }
        }
    }

    get owner () {
        var owners = this._owners;

        return owners[owners.length - 1] || null;
    }

    atEnd () {
        return !this.more();
    }

    isAnd (s) {
        return this.andRe.test(s);
    }

    isConjunction (s) {
        return this.conjunctionRe.test(s);
    }

    isThen (s) {
        return this.thenRe.test(s);
    }

    more () {
        return this._unpulls.length > 0 || this._index < this._args.length;
    }

    ownerPop (owner) {
        if (!owner || owner === this.owner) {
            var o = this._owners.pop();
            if (o) {
                o.args = null;
            }
        }
    }

    ownerPush (owner) {
        this._owners.push(owner);
        owner.args = this;
    }

    pull () {
        const me = this;
        var a = me._unpulls;

        if (a.length) {
            // Items in our unpulls queue have already been parsed and should not be
            // reprocessed (since "@@foo" becomes "@foo" as an arg).
            return Promise.resolve(a.shift());
        }

        a = me._args;
        let index = me._index;

        if (index < a.length) {
            let promise = me.loader.expand(a[index]);

            if (promise.fileName) {
                // If the loader needs to load a response file, we need to get in
                // the middle to replace the original argument.
                return promise.then(lines => {
                    me._replaceResponseFileArg(index, lines);

                    return me.pull();
                });
            }

            // Indicate that we've extracted this arg...
            ++me._index;
            return promise;
        }

        // We always return a promise, even at END. This is because we could hit a
        // condition like this:
        //
        //      foo @bar.txt
        //
        // But "bar.txt" is an empty file. So no arguments replace the one we started
        // processing with a promise. So the caller would have to handle
        //
        return Promise.resolve(null);
    }

    unpull (arg) {
        let q = this._unpulls;

        if (Array.isArray(arg)) {
            q.unshift(...arg);
        } else {
            q.unshift(arg);
        }
    }

    _replaceResponseFileArg (index, lines) {
        this._args.splice(index, 1, ...lines);
    }
}

Object.assign(Arguments.prototype, {
    andRe: /\band\b/i,
    thenRe: /\bthen\b/i,
    conjunctionRe: /\band\b|\bthen\b/i
});

module.exports = Arguments;
