"use strict";

/**
 * This class is the base for the items in an `Items` collection. The `Value` class and
 * the `Cmd` (internal) class extend this base for different types of collections.
 */
class Item {
    constructor (config) {
        Object.assign(this, config);

        if (this.init) {
            this.init();
        }

        this.verify();
    }
}

Item.prototype.isItem = true;

module.exports = Item;
