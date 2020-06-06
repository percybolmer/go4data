"use strict";

const Value = require('./Value');

// Playground for above: https://jsfiddle.net/yo6m18xr/

/**
 * This class manages a case-insensitive collection of named items for a class. This is
 * used to manage "parameters" for Command's and "commands" for Containers as well as
 * "switches" for both.
 * @private
 */
class Items {
    static get (owner) {
        var name = this.kinds;
        var key = '_' + name;
        var ret = owner[key];

        if (!owner.hasOwnProperty(key)) {
            let base = this.get(Object.getPrototypeOf(owner), name);

            owner[key] = ret = new this(owner, base);
        }

        return ret;
    }

    constructor (owner, base) {
        this.owner = owner;

        if (base) {
            this.base = base;
            this.items = base.items.slice();
            this.map = Object.create(base.map);
        } else {
            this.base = null;
            this.items = [];
            this.map = {};
        }
    }

    * [Symbol.iterator] () {
        var map = this.map;

        for (var key in map) {
            let item = map[key];

            // Filter out all aliases of an item
            if (item.name === key) {
                yield item;
            }
        }
    }

    get kind () {
        return this.constructor.kind;
    }

    get kinds () {
        return this.constructor.kinds;
    }

    add (name, item) {
        var ItemType = this.itemType,
            kind = this.constructor.kind;
        
        if (item) {
            item = ItemType.parse(item, kind);
        } else {
            item = ItemType.parse(name, kind);
            name = item.name;
        }

        item.name = name;
        item.loname = name.toLowerCase();

        if (!item.isItem) {
            item = new ItemType(item);
        }

        this.canAdd(item);

        this.items.push(item);
        this.map[name] = this.map[item.loname] = item;

        return item;
    }

    addAll (all) {
        if (typeof all === 'string') {
            all = all.trim().split(/\s+/);

            all.forEach(part => this.add(part));
        }
        else if (Array.isArray(all)) {
            for (let item of all) {
                if (typeof item === 'string') {
                    this.add(item);
                } else {
                    this.add(item.name, item);
                }
            }
        }
        else {
            for (let name in all) {
                let item = all[name];

                if (typeof item !== 'string') {
                    this.add(name, item);
                }
            }

            for (let name in all) {
                let item = all[name];

                if (typeof item === 'string') {
                    this.alias(name, item);
                }
            }
        }
    }
    
    alias (alias, actualName) {
        throw new Error(`Can only apply aliases to commands: "${alias}" = "${actualName}"`);
    }

    /**
     * This method applies default values for missing parameters.
     * @param {Object} params The parameter data object.
     */
    applyDefaults (params) {
        for (let item of this.items) {
            if (item.optional && !(item.name in params)) {
                if ('value' in item) {
                    item.set(params, item.value);
                }
                else if (item.vargs) {
                    // For optional vargs parameters, drop an empty array in the params
                    // to avoid NPEs (like a rest operator).
                    params[item.name] = [];
                }
                // else we could put the default value for item.type but that would be
                // hard to distinguish from non-supplied parameters (set item.value if
                // that is preferred).
            }
        }
    }

    at (index) {
        return this.items[index] || null;
    }

    canAdd (item) {
        let name = item.name;

        // Allow derived classes to overwrite inherited items
        if (this.map.hasOwnProperty(name) || this.map.hasOwnProperty(item.loname)) {
            throw new Error(`Duplicate ${this.kind} "${name}"`);
        }
    }
    
    get (name) {
        var map = this.map;

        return map[name] || map[name.toLowerCase()];
    }

    /**
     * This method returns an array of `Value` that need to be confirmed or asked .
     * @param {Object} params The parameter data object to validate, required params that are not present here will be returned.
     * @return {Array} The `Value`s to confirm or ask, null if there are none.
     */
    getToConfirm (params) {
        var items = [];

        for (let item of this.items) {
            if (item.confirm && (item.name in params)) {
                item.value = params[item.name];
            }
            if (item.confirm || item.required && !(item.name in params)) {
                item.kind = this.kind;
                items.push(item);
            }
        }
        return items;
    }

    lookup (name) {
        var map = this.map,
            entry, first, loname, matches, ret;

        ret = map[name] || map[loname = name.toLowerCase()];

        if (!ret) {
            let ignore = {};
            
            for (let key in map) {
                entry = map[key];

                if (ignore[entry.name]) {
                    // ignore aliases for the same thing (ex "fooBar" and "foobar")
                    continue;
                }
                
                ignore[entry.name] = true;

                if (key.startsWith(loname) || key.startsWith(name)) {
                    if (!ret) {
                        first = key;
                        ret = entry;
                    }
                    else {
                        if (!matches) {
                            matches = [first];
                        }

                        matches.push(key);
                    }
                }
            }
            
            if (matches) {
                // If we have multiple matches then the name we were given is
                // ambiguous (so throw):
                throw new Error(`"${name}" matches multiple ${this.kinds} for ${this.owner.title}: ${matches.join(', ')}`);
                // "bar" matches multiple switches for "git commit"
                // "foo" matches multiple commands for "git"
            }
        }

        return ret || null;
    }
}

module.exports = Items;
