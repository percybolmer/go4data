"use strict";

const Item = require('./Item');
const Items = require('./Items');

class Cmd extends Item {
    static parse (def) {
        if (typeof def !== 'string') {
            if (def.isCmdlet) {
                def = {
                    type: def
                };
            }

            return def;
        }
        
        // This method would be called if user calls add('foo') or more likely if they
        // call:
        //
        //      C.define({
        //          commands: 'foo bar'
        //      });
        //
        // Neither is valid for a command container.
        //
        throw new Error(`Missing command definition for ${def}`);
    }

    constructor (config) {
        super(config);

        this.aliases = [];
    }

    create (parent) {
        var cmd = new this.type();

        if (parent) {
            cmd.attach(parent, this.name);
        }

        return cmd;
    }

    verify () {
        if (!this.type.isCmdlet) {
            throw new Error(`Invalid command type "${this.type}" (must extend Cmdlet)`);
        }
    }
}

Cmd.isCmd = Cmd.prototype.isCmd = true;

/**
 * This class manages a case-insensitive collection of named commands.
 * @private
 */
class Commands extends Items {
    alias (alias, actualName) {
        var map = this.map,
            item = map[actualName],
            loname = alias.toLowerCase();
        
        if (!item) {
            throw new Error(`No such command "${actualName}" for alias "${alias}"`);
        }

        map[alias] = map[loname] = item;
        item.aliases.push(alias);
    }
}

Commands.kind = 'command';
Commands.kinds = 'commands';
Commands.itemType = Commands.prototype.itemType = Cmd;
Commands.isCommands = Commands.prototype.isCommands = true;

module.exports = Commands;
