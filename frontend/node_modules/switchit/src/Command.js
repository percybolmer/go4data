"use strict";

const Cmdlet = require('./Cmdlet');
const Parameters = require('./Parameters');

class Command extends Cmdlet {
    static defineAspect (name, value) {
        if (name === 'parameters') {
            var parameters = this.parameters;

            parameters.addAll(value);

            let switches = this.switches;
            for (let param of parameters) {
                if (param.switch) {
                    let name = param.name;

                    if (switches.get(name)) {
                        throw new Error(`Parameter ${name} already defined as a switch`);
                    }

                    switches.add(param);
                }
            }
        }
        else {
            super.defineAspect(name, value);
        }
    }

    static defineItemHelp (name, text) {
        let ok = super.defineItemHelp(name, text);

        let item = this.parameters.get(name);

        if (item) {
            item.help = text;
            ok = true;
        }

        return ok;
    }

    static get parameters () {
        return Parameters.get(this);
    }

    static getAspects (includePrivate = true) {
        return Object.assign(super.getAspects(includePrivate), {
            command: true,
            parameters: this.parameters.items.map((p) => {
                if (!p.private || includePrivate) return p;
            })
        });
    }

    //-----------------------------------------------------------

    constructor () {
        super();

        // The next positional parameter to accept
        this._paramPos = 0;
    }

    get parameters () {
        return this.constructor.parameters;
    }

    applyDefaults (params) {
        super.applyDefaults(params);

        this.parameters.applyDefaults(params);
    }

    beforeExecute (params) {
        super.beforeExecute(params);
        let me = this;
        me.parameters.getToConfirm(params || this.params).forEach((item) => me.ask(item));
    }

    processArg (arg, args) {
        let param = this.parameters.at(this._paramPos);

        if (!param) {
            // We've run out of parameters so let the base class take over...
            return super.processArg(arg, args);
        }

        let value = param.convert(arg);

        if (value === null) {
            if (param.required && !(param.name in this.params)) {
                this.raise(`Invalid value for "${param.name}" (expected ${param.type}): "${arg}"`);
            }

            // Since this param is optional or we have at least one valid argument
            // for it, skip to the next candidate and try it (this is the only way to
            // advance past a vargs param):
            ++this._paramPos;
            args.unpull(arg);
        }
        else {
            param.set(this.params, value);

            // We'll park on a vargs parameter until we hit an non-parsable arg...
            if (!param.vargs) {
                ++this._paramPos;
            }
        }

        return this.configure(args);
    }

    updateFromAnswers (answers, params) {
        super.updateFromAnswers(answers, params);
        for (let paramName of Object.keys(answers)) {
            let entry = this.parameters.lookup(paramName);
            if (entry) {
                entry.setRaw(params, answers[paramName]);
                delete answers[paramName];
            }
        }
    }

    //---------------------------------------------------------------
    // Private
}

Object.assign(Command, {
    isCommand: true,

    _parameters: new Parameters(Command)
});

Object.assign(Command.prototype, {
    isCommand: true
});

module.exports = Command;
