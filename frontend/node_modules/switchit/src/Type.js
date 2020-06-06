"use strict";

const semver = require('semver');

/**
 * @class Type
 * This class manages type conversions for a single data type. Instances of this class
 * are created by `Type.define`.
 */
class Type {
    /**
     * Adds a type definition to the registry.
     * @param {Type} def The `Type` instance or a config object for one.
     */
    static define (def) {
        // Type instances are stored on the defs object (for easy iteration) and directly
        // on the Type constructor (for easy use). Check constructor to prevent smashing
        // one of its static methods.
        if (Type[def.name]) {
            throw new Error(`Type already defined: "${def.name}"`);
        }

        if (!def.isType) {
            def = new Type(def);
        }

        Type.defs[def.name] = Type[def.name] = def;
    }

    static get (name) {
        return Type.defs[name] || null;
    }

    /**
     * Returns the `Type` instance appropriate to the given `value`.
     * @param {*} value The value to determine.
     * @return {Type} The `Type` of the `value`.
     */
    static of (value) {
        let def = Type.pick(value, def => def.is(value));

        if (!def) {
            // If the value is not a direct type match, see who can parse it
            def = Type.pick(value, def => def.convert(value) !== null);
        }

        return def;
    }

    /**
     * Picks and returns the uniquely matching `Type` that matches the provided `test`
     * function.
     * @param {*} [value] A value to describe what is being sought. This is only used for
     * the `Error` thrown if multiple matches are found. If this value is `null` or not
     * provided, the array of matching names is returned.
     * @param {Function} test
     * @return {Type/String[]} The uniquely matching `Type` or `null` for no matches. If
     * no `value` is provided and multiple matches are found, the array of matching names
     * is returned.
     */
    static pick (value, test) {
        let defs = Type.defs;
        let found = null;
        let ambiguous;

        if (!test) {
            test = value;
            value = null;
        }

        for (let s in defs) {
            let def = defs[s];

            if (test(def, value)) {
                if (found) {
                    (ambiguous || (ambiguous = [found.name])).push(s);
                }

                found = def;
            }
        }

        if (ambiguous) {
            if (value === null) {
                return ambiguous;
            }
            throw new Error(`Ambiguous type for "${value}"; could be: ${ambiguous.join(', ')}`);
        }

        return found;
    }

    constructor (config) {
        Object.assign(this, config);
    }

    /**
     * Converts the given value to this type of data. If the value cannot be converted,
     * `null` is returned.
     * @param {*} value The value to convert.
     * @return {*} The converted value or `null`.
     */
    convert (value) {
        return value;
    }

    /**
     * Returns `true` if the `value` is already of this type.
     * @param {*} value The value to test.
     * @return {Boolean} `true` if the type of `value` is this type, `false` if not.
     */
    is (value) {
        return this.name === typeof value;
    }
}

Type.defs = {};
Type.prototype.isType = true;

class BooleanType extends Type {
    constructor () {
        super({
            anyRe: /^(?:true|false|yes|no|on|off)$/i,
            trueRe: /^(?:true|yes|on)$/i,
            falseRe: /^(?:false|no|off)$/i,

            default: false,
            name: 'boolean',
            help: 'One of true|false|yes|no|on|off'
        });
    }

    convert (value) {
        var r = value;

        if (typeof value !== 'boolean') {
            r = String(r);

            if (this.trueRe.test(r)) {
                r = true;
            } else if (this.falseRe.test(r)) {
                r = false;
            } else {
                r = null;
            }
        }

        return r;
    }
}

class NumberType extends Type {
    constructor () {
        super({
            default: 0,
            name: 'number',

            re: /^[-+]?[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?$/i,
            help: 'A numerical value'
        });
    }

    convert (value) {
        let me = this;
        if (Array.isArray(value)) {
            return value.map((i) => me.convert(i));
        }

        var r = +value;  // good start...

        if (typeof value !== 'number') {
            if (value === false) {
                return 0;
            }
            // parseFloat accepts numbers followed by non-sense...
            // Beware of operator + and isNaN...
            //
            //      +'' === 0 (ok...)
            //      +null === 0 (oh yeah)
            //      isNaN(null) === false (srsly!)
            //      isNaN('') === false (now you're just being mean!)
            //      +'  \t ' === 0  (out of here!)

            let s = String(value);

            if (!this.re.test(s)) {
                r = null;
            }
        }

        return r;
    }
}

class StringType extends Type {
    constructor () {
        super({
            default: '',
            name: 'string'
        });
    }

    convert (value) {
        if (value == null || value === false) {
            return null;
        }

        let me = this;
        if (Array.isArray(value)) {
            return value.map((i) => me.convert(i));
        }
        return String(value);
    }
}

class SemverType extends Type {
    constructor () {
        super({
            default: '1.0.0',
            name: 'semver',
            help: 'A SemVer version, parsed by node-semver'
        });
    }

    convert (value) {
        let me = this;
        if (Array.isArray(value)) {
            return value.map((i) => me.convert(i));
        }
        return semver.parse(value||'');
    }

    is (value) {
        return semver.parse(value) !== null;
    }
}

Type.define(new BooleanType());
Type.define(new NumberType());
Type.define(new StringType());
Type.define(new SemverType());

module.exports = Type;
