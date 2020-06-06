"use strict";

const EMPTY = [];
const Item = require('./Item');
const Type = require('./Type');

const itemRe = new RegExp('^\\s*(?:' +
                '(?:([a-z])#)?([a-z_][\\w-]*)' +         // optional ("c#" [1]) "name" [2]
                '(?:[:]([a-z_]\\w*))?' +          // optional ":type" [3]
                '((?:\\.\\.\\.)|(?:\\[\\]))?'  +  // optional "..." or "[]" [4]
            ')\\s*$', 'i');

/**
 * This class is used for switches and parameters in an `Items` collection. All `Value`
 * instances must have a corresponding defined `Type` in the `Types` registry. This can
 * be set by providing a `type` config property. If no `type` is specified, the `value`
 * (if given) is used. If neither `type` nor `value` are given, `type` defaults to `string`.
 */
class Value extends Item {
    /**
     * This method accepts a string and produces an item config object.
     * @param {String/Object} def
     * @param {"parameter"/"switch"} kind
     * @return {Object}
     */
    static parse (def, kind) {
        if (typeof def !== 'string') {
            // If we have an Item already or if def is a simple Object, we leave it as
            // is and return it. Otherwise, assume it is the value property and wrap it
            // in an object.
            if (!(def && (def.isItem || def.constructor === Object))) {
                def = {
                    value: def
                };
            }

            return def;
        }

        // String syntax: "[ { c # name :type ... [] } ]"
        //
        // The "[]" wrapping indicates optionality.
        // The "{}" wrapping indicates a parameter that is also a switch.
        // The "c#" prefix configures the single char name (case-sensitive).
        // The "name" is the canonical name.
        // The ":type" suffix indicates the data type (string is default).
        // Either "..." or "[]" indicates multiple values are allowed.

        var valid = true,
            optional = false,
            switchy = false,
            i, item, value, confirm;

        // Peel off "[]" from "[foo]" to leave "foo" (remember it as optional).
        if (def[0] === '[') {
            valid = def.endsWith(']');
            if (valid) {
                def = def.substr(1, def.length - 2);
                optional = true;
            }
        }

        // Peel off "{}" from "{bar}" to leave "bar" (remember it is a switch).
        // By cascade we also handle "[{foobar}]" combination
        if (valid && def[0] === '{') {
            valid = def.endsWith('}');
            if (valid) {
                def = def.substr(1, def.length - 2);
                // Only parameters use "{foo}" syntax
                valid = kind === 'parameter';
                switchy = true;
            }
        }

        // Lop off the value part of "foo=value" (including the "="):
        if (valid && optional) {
            i = def.indexOf('=');
            if (i > 0) {
                value = def.substr(i + 1);
                if (def.charAt(i-1) === "?") {
                    confirm = true;
                    i--;
                }
                def = def.substr(0, i);
            }
        }

        // Regex the rest... roughly: name(:type)?(...|[])?
        let match = itemRe.exec(def);

        if (match) {
            //  "r#recurse:string[]"  // [ ., 'r', 'recurse', 'string', '[]' ]
            item = {
                name: match[2],
                char: match[1] || null,
                type: match[3] || null,
                optional: optional,  // may not have a default value...
                switch: switchy,
                vargs: !!match[4],
                confirm: confirm
            };
        }

        if (!valid || !item) {
            throw new Error(`Invalid ${kind} definition syntax: "${def}"`);
        }

        if (value !== undefined) {
            // Only set a value if we have one (presence is detected via "in" operator):
            item.value = value;
        }

        return item;
    }

    init () {
        // Allow the user to provide "optional:true|false" or "required:true|false"
        // and calculate the other from it:
        if (this.optional !== undefined) {
            this.required = !this.optional;
        }
        else if (this.required !== undefined) {
            this.optional = !this.required;
        }
        else {
            this.optional = 'value' in this;
            this.required = !this.optional;
        }

        if (!this.type) {
            if ('value' in this) {
                let type = Type.of(this.value);

                if (!type) {
                    throw new Error(`No type for "${this.value}" (use Type.define to define it)`);
                }

                this.type = type.name;
            }
            else {
                this.type = 'string';
            }
        }
        this.typeCls = Type.get(this.type);
    }

    /**
     * This method is empty and is intended to allow the user to post-process new
     * values after they have been added to the parameter data.
     * @param {Object} data The parameter data object.
     * @param {*} value The new value just added to `data`.
     */
    apply (data, value) {
        // empty
    }

    /**
     * Converts the given value to the appropriate type. If the value cannot be converted,
     * `null` is returned.
     * @param {*} value The value to convert.
     * @return {*} The `value` suitably converted or `null` if that is not possible.
     */
    convert (value) {
        var def = this.typeOf;

        return def.convert(value);
    }

    mustConvert (value) {
        var converted = this.convert(value);

        if (converted === null) {
            throw new Error(`Invalid ${this.typeOf.name} value: "${value}"`);
        }

        return converted;
    }

    /**
     * Adds a value to the parameter data object. Handles `vargs` by always producing
     * an array.
     * @param {Object} data The parameter data object.
     * @param {*} value The new value to add `data`.
     */
    set (data, value) {
        let v = value;

        if (this.vargs) {
            v = data[this.name];
            v = (v || EMPTY).concat(value);  // handle 4 or [4,5]
        }

        data[this.name] = v;

        this.apply(data, value);
    }

    /**
     * Attempts to get this value in the parameter data object based on the given value.
     * @param {Object} data The parameter data object.
     * @param {*} value The new value to add `data`.
     * @return {0/1/2/3} One of the following values:
     *     0 - The value was set successfully
     *     1 - Missing value
     *     2 - Invalid value
     *     3 - Value ignored
     */
    setRaw (data, value) {
        var me = this;
        var converted = me.convert(value);
        var name = me.name;
        var ret = 0;

        if (converted === null) {
            // If we have no (convertible) value, see if we can default something
            // for it...
            if (me.type === 'boolean') {
                // "--foo" toggles booleans if no value is provided

                if (name in data) {
                    converted = !data[name];
                }
                else if ('value' in me) {
                    converted = !me.value;
                }
                else {
                    // No value to toggle...
                    return 1;
                }

                ret = 3;
            }
            else if (me.type === 'number') {
                if (name in data) {
                    converted = data[name] + 1;
                }
                else if ('value' in me) {
                    converted = me.value + 1;
                }
                else if (value !== null) {
                    // If we cannot adjust but did have a value then the value is not
                    // missing but invalid.
                    return 2;
                } else {
                    // No value to adjust...
                    return 1;
                }

                ret = 3;
            }
            else if (value !== null) {
                // If we cannot convert but did have a value then the value is not
                // missing but invalid.
                return 2;
            }
            else {
                return 1;
            }
        }

        me.set(data, converted);
        return ret;
    }

    verify () {
        var type = this.typeOf;

        if (!type) {
            throw new Error(`Unknown value type "${this.type}" (use Type.define to define it)`);
        }

        // Handle the default value. It must convert to this type...
        if ('value' in this) {
            var v = this.value,
                c;

            if (!this.vargs) {
                c = this.mustConvert(v);
            }
            else {
                // Default values for arrays are more tricky. If we have an array,
                // each element must convert. Otherwise, the value itself is converted
                // to the first element.
                c = [];

                if (Array.isArray(v)) {
                    for (let e of v) {
                        c.push(this.mustConvert(e));
                    }
                }
                else {
                    c.push(this.mustConvert(v));
                }
            }

            this.value = c;
        }
    }

    get typeOf () {
        return Type.defs[this.type];
    }
}

Value.prototype.isValue = true;
Value.prototype.vargs = false;

module.exports = Value;
