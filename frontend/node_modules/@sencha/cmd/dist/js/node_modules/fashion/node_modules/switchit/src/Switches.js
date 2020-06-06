"use strict";

const Items = require('./Items');
const Value = require('./Value');

/**
 * This class manages a case-insensitive collection of named switches.
 * @private
 */
class Switches extends Items {
    constructor (owner, base) {
        super(owner, base);
        
        if (base) {
            this.charMap = Object.create(base.charMap);
        } else {
            this.charMap = {};
        }
    }

    add (name, item) {
        item = super.add(name, item);
        
        let ch = item.char;
        if (ch) {
            this.charMap[ch] = item;
        }

        return item;
    }
    
    canAdd (item) {
        super.canAdd(item);
        
        let ch = item.char;
        
        if (ch && this.charMap[ch]) {
            throw new Error(`Duplicate switch character "${ch}"`);
        }
    }

    lookup (name) {
        var item = this.charMap[name];

        if (!item) {
            item = super.lookup(name);
        }

        return item;
    }
}

Switches.kind = 'switch';
Switches.kinds = 'switches';
Switches.itemType = Switches.prototype.itemType = Value;
Switches.isSwitches = Switches.prototype.isSwitches = true;

module.exports = Switches;
