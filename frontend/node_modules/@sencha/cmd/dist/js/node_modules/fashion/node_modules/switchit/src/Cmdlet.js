"use strict";

const chalk = require('chalk');
const inquirer = require('inquirer');
const File = require('phylo');

const Arguments = require('./Arguments');
const Switches = require('./Switches');
const Type = require('./Type');
const Util = require('./Util');

const paramRe = /^-{1,2}([a-z][\w-]*)$/i;
const shortParamGroupRe = /^-([a-z][\w-]*)$/i;
const paramAssignRe = /-{1,2}([^=]+)=(.*)/i;
const negativeParamRe = /^-{1,2}no-([a-z][\w-]*)$/i;
const plusParamRe = /\+([a-z_-][\w-]*)/i;

/**
 * This is the abstract base class for the `Command` and `Container` classes. All
 * Cmdlets have a set of `switches` tracked at the class level.
 *
 * Instances of Cmdlets have a `parent` reference to the Cmdlet instance that created it.
 * The top-most Cmdlet will have a `null` value for its `parent` and it is said to be the
 * root. Since only one Cmdlet can be active at a time, Cmdlets can also have a `child`
 * reference.
 *
 * Given a three level command invocation like this:
 *
 *      foo bar zip
 *
 * There are 3 Cmdlets: "foo", "bar" and "zip". The first two are `Container` instances
 * while the last is a `Command` instance.
 *
 *      foo.down()      === bar
 *      foo.down('zip') === zip
 *      foo.leaf()      === zip
 *
 *      bar.up()   === foo
 *      bar.root() === foo
 *      bar.down() === zip
 *      bar.leaf() === zip
 *
 *      zip.up()      === bar
 *      zip.up('foo') === foo
 *      zip.root()    === foo
 *
 * Or visually:
 *
 *      Container               Container                Command
 *      +=======+    child      +=======+    child      +=======+
 *      |       | ------------> |       | ------------> |       |
 *      |  foo  |               |  bar  |               |  zip  |
 *      |       | <------------ |       | <------------ |       |
 *      +=======+    parent     +=======+    parent     +=======+
 *
 *        .down() --------------> .
 *
 *        .down('zip') ---------------------------------> .
 *
 *        .leaf() --------------------------------------> .
 *
 *        . <-------------------- .up()
 *
 *        . <-------------------- .root()
 *
 *                                .down() --------------> .
 *
 *                                .leaf() --------------> .
 *
 *                                . <-------------------- .up()
 *
 *        . <-------------------------------------------- .up('foo')
 *
 *        . <-------------------------------------------- .root()
 *
 * As instances are created to process arguments, they are attached to this chain as well
 * as pushed on to the `owner` stack of the associated `Arguments` instance.
 *
 * As instances are cleaned up (via `destroy`), they are detached from this chain and
 * popped off the `Arguments` ownership stack.
 */
class Cmdlet {
    static define (members) {
        // Process switches first so that parameters can link up with existing
        // switches
        if (members.switches) {
            this.defineAspect('switches', members.switches);
        }

        for (let name in members) {
            if (name !== 'switches' && name !== 'help') {
                this.defineAspect(name, members[name]);
            }
        }

        // Define help last so it can attach text to any defined switch or
        // parameter....
        if (members.help) {
            this.defineAspect('help', members.help);
        }
    }

    static defineAspect (name, value) {
        if (name === 'switches') {
            let items = this.switches;
            items.addAll(value);
        }
        else if (name === 'help') {
            this.defineHelp(value);
        }
        else if (name == 'interactive') {
            this.defineInteractive(value);
        }
        else if (name == 'logo') {
            this.defineLogo(value);
        }
        else {
            this[name] = value;
        }
    }

    /**
     * Handle this type of thing:
     *
     *      help: {
     *          '': 'My help stuff',
     *
     *          switch: 'Help on a switch',
     *          param: 'Help on a parameter'
     *      }
     *
     * Help for sub-commands is handled in the define call for that class.
     */
    static defineHelp (value) {
        if (typeof value === 'string') {
            this.help = value;
        }
        else if (value) {
            for (let name in value) {
                let text = value[name];

                if (name === '') {
                    this.help = text;
                } else {
                    let ok = this.defineItemHelp(name, text);

                    if (!ok) {
                        throw new Error(`No parameter or switch "${name}" for help text "${text}"`);
                    }
                }
            }
        }
    }

    static defineInteractive (value) {
        let re = /^(!)?([a-z_-]+)$/;
        if (value === true) {
            value = "!headless";
        }
        if (value !== false && (typeof value === 'string' || value instanceof String)) {
            if (!re.test(value)) {
                throw new Error(`Invalid syntax for 'interactive' aspect: ${value}`);
            }
            let match = value.match(re);
            let invert = match[1];
            let switchName = match[2];

            this.switches.add(`[${switchName}:boolean=false]`);

            this.interactiveParam = switchName;
            this.interactiveInvert = !!invert;
        }
    }
    
    static defineItemHelp (name, text) {
        let item = this.switches.get(name);
        let ok;

        if (item) {
            item.help = text;
            ok = true;
        }
        
        return ok;
    }

    static defineLogo (value) {
        if (value !== false) {
            this._shouldShowLogo = true;
        }
        let boolVal = Type.get('boolean').convert(value);
        if (boolVal) {
            this._logo = true;
        } else if (boolVal === null) {
            if (value instanceof String || typeof value === 'string') {
                this._logo = {
                    name: value
                };
            } else if (value instanceof Object || typeof value === 'object') {
                if (value.name || value.version) {
                    this._logo = value;
                } else {
                    this._shouldShowLogo = false;
                }
            } else {
                this._shouldShowLogo = false;
            }
        }
    }

    static get switches () {
        return Switches.get(this);
    }

    static get title () {
        return this._title || this.name;
    }

    static set title (v) {
        this._title = v;
    }

    static getAspects (includePrivate = false) {
        return {
            switches: this.switches.items.map((s) => {
                if (!s.private || includePrivate) return s;
            }),
            title: this.title,
            help: this.help
        }
    }
    
    //-----------------------------------------------------------

    constructor () {
        this.id = ++Cmdlet.idSeed;
        this.params = {};
    }

    get fullName () {
        var s = this.parent;
        
        s = s ? s.fullName + ' ' : '';
        
        return s.toLowerCase() + (this.name || this.constructor.title).toLowerCase();
    }

    get switches () {
        return this.constructor.switches;
    }

    get logo () {
        let me = this;
        let cls = me.constructor;
        let pkg = me.root().pkgConfig || {};
        let name = (cls.name || pkg.name).toLowerCase();
        let version = pkg.version;

        if (cls._logo === true) {
            cls._logo = {};
        }

        cls._logo = Object.assign({
            name, version
        }, cls._logo);
 
        return `${cls._logo.name}${cls._logo.version ? ' v' + cls._logo.version : ''}`;        
    }

    applyDefaults (params) {
        this.switches.applyDefaults(params);
    }

    ask (entry) {
        if (this.askQueue.fields.indexOf(entry.name) !== -1) {
            return;
        }
        if (!('value' in entry)) {
            if (!(`missing${entry.kind}` in this.askQueue)) {
                this.askQueue[`missing${entry.kind}`] = [];
                this.askQueue[`${entry.kind}`] = 0;
            }
            this.askQueue[`missing${entry.kind}`].push(entry.name);
            this.askQueue[`${entry.kind}`]++;
            this.askQueue.missing++;
        }
        (this.askQueue.all || (this.askQueue.all = [])).push(entry);
        this.askQueue.fields.push(entry.name);
    }

    askMissing (params) {
        var me = this;
        return new Promise((resolve, reject) => {
            if (me.askQueue.missing == 0) {
                return resolve();
            }
            if (!me.isInteractive()) {
                let msg = ["Missing value for"];
                if (me.askQueue.switch > 0) {
                    msg.push(`${Util.pluralize('switch', me.askQueue.switch, 'es')}: "${me.askQueue.missingswitch.join(', ')}"`)
                }
                if (me.askQueue.parameter > 0) {
                    msg.push(`${Util.pluralize('parameter', me.askQueue.parameter)}: "${me.askQueue.missingparameter.join(', ')}"`);
                    if (msg.length > 2) { // Reformat the message because we have both switches and parameters missing.
                        msg[0] = `${msg[0]}\n`;
                        msg[1] = ` - ${msg[1]}\n`;
                        msg[2] = ` - ${msg[2]}`;
                    }
                }
                reject(new Error (msg.join(' ')));
            } else {
                let prompts = [];

                me.askQueue.all.sort((a,b) => {
                    return a.name > b.name;
                }).forEach((entry) => {
                    prompts.push({
                        name: entry.name,
                        validate: (input) => {
                            // If we're here this means we can't take an empty value
                            if (input === '' && (('value' in entry && entry.value !== '') || !('value' in entry))) {
                                return `${Util.capitalize(entry.kind)} '${entry.name}' can't be empty.`;
                            }
                            // If the value doesn't convert, then we've got a problem!
                            if (entry.typeCls.convert(input) === null) {
                                return `${Util.capitalize(entry.kind)} '${entry.name}' needs to be a ${entry.type} (${entry.typeCls.help})`;
                            }
                            return true;
                        },
                        help: `${entry.help ? entry.help : ''}${entry.vargs ? (entry.help ? '\n':'') + '(Enter each value on a separate line and a blank value at the end)' : ''}`,
                        message: `${entry.name}${entry.type !== 'string' ? ' <' + entry.type + '>' : ''}:`,
                        vargs: entry.vargs,
                        type: entry.type === 'boolean' ? 'confirm' : 'input',
                        default: ('value' in entry && entry.value !== '' ? entry.value : undefined)
                    });
                });

                if (!!me.constructor.help) {
                    console.log(me.constructor.help);
                }
                console.log("Press ^C at any time to quit.\n");

                // Since some prompts require special treatment (I'm looking at you vargs), this function will take care
                // of each individually
                let allAnswers = {};
                let showNextPrompt = (answers) => {
                    // Accumulate all answers
                    Object.assign(allAnswers, answers || {});
                    if (prompts.length > 0) {
                        let next = prompts.shift();
                        if (next.help) {
                            console.log(next.help);
                        }
                        // This is a varargs prompt, let's take care of it...
                        if (next.vargs) {
                            let values = [];
                            next._askAgain = true;

                            // Wrap the original validate to account for the vargs validations
                            next._validate = next.validate;
                            next.validate = (input) => {
                                // If we don't have a value yet and you just pressed enter fail because at least one is needed!
                                if (values.length == 0 && input === '') {
                                    return `You must provide at least one value for '${next.name}'`;
                                } else if (input === '') {
                                    // We have at least one value and you just pressed enter, stop asking
                                    next._askAgain = false;
                                    return true;
                                } else {
                                    // Any value should pass the original validation!
                                    return next._validate(input);
                                }
                            };
                            // Yo dawg! I heard you like recursion...
                            let askAnother = (done) => {
                                return inquirer.prompt(next).then((props) => {
                                    // Since we don't want that extra empty line here, skip it
                                    if (props[next.name] != '') {
                                        values.push(props[next.name]);
                                    }
                                    if (next._askAgain) {
                                          return askAnother(done);
                                    } else {
                                        // Since we're not asking anymore, move forward with all accumulated answers
                                        // 'done' here should be 'showNextPrompt'
                                        return done({
                                            [next.name]: values
                                        });
                                    }
                                });
                            };
                            // Start asking for multiple values!
                            return askAnother(showNextPrompt);
                        } else {
                            // This is a 'regular' prompt, ask away!
                            return inquirer.prompt(next).then(showNextPrompt);
                        }
                    }
                };

                // Show first prompt
                showNextPrompt().then(function () {
                    // This promise will be fulfilled when all prompts are complete
                    me.updateFromAnswers(allAnswers, params);
                    return resolve();
                });
            }
        });
    }

    atRoot () {
        return !this.parent;
    }

    attach (parent, name) {
        this.parent = parent;
        this.name = name;
        parent.child = this;
        return this;
    }

    beforeExecute (params) {
        var me = this;

        me.switches.getToConfirm(params || this.params).forEach((item) => me.ask(item));

        me.interactive = params[me.constructor.interactiveParam];
        if (me.constructor.interactiveInvert) {
            me.interactive = !me.interactive;
        }
        delete params[me.constructor.interactiveParam];
    }
    
    configure (args) {
        const me = this;
        var params = me.params,
            switches = me.switches,
            entry, match, val;

        this.askQueue = {
            fields: [],
            missing: 0
        };

        return args.pull().then(arg => {
            // While we have arguments, try to process them
            if (arg !== null) {
                match = plusParamRe.exec(arg);

                if (match) {
                    // +param
                    val = true;
                }
                else if (match = negativeParamRe.exec(arg)) {
                    val = false;
                }
                else if ((match = paramAssignRe.exec(arg))) {  // <== assignment
                    // --param=value
                    val = match[2];
                }
                else if ((match = paramRe.exec(arg))) {  // <== assignment
                    // --param value
                    entry = switches.lookup(match[1]);

                    if (!entry) {
                        me.raise(`Unknown switch: ${match[1]}`);
                    }
                    return args.pull().then(value => {
                        let result = entry.setRaw(params, value);

                        if (result === 1) { // Missing value
                            me.ask(entry);
                        }
                        if (result === 2) {  // Invalid value
                            me.raise(`Invalid value for "${entry.name}" switch: "${value}"`);
                        }

                        if (result === 3) { // Ignored value
                            args.unpull(value);
                        }
                        // else Success

                        return me.configure(args);
                    });
                }
                else {
                    // Non-switch, check for other types of arguments (parameters)...
                    return me.processArg(arg, args);
                }

                entry = switches.lookup(match[1]);

                if (!entry) {
                    me.raise(`Unknown switch: ${match[1]}`);
                }

                entry.setRaw(params, val);

                return me.configure(args);
            }
        });
    }

    destroy () {
        var parent = this.parent;

        if (parent) {
            this.parent = null;

            if (parent.child === this) {
                parent.child = null;
            }
        }
    }

    dispatch (args) {
        var me = this;
        var params = me.params;

        args.ownerPush(me);

        if (this.atRoot()) { 
            this.rootDir = File.from(require.main.filename).upTo('package.json').parent; 
            this.pkgConfig = this.rootDir.join('package.json').load(); 
            // This is to avoid examples loading the main project package.json info 
            if (this.pkgConfig.name === 'switchit') { 
                this.pkgConfig = {}; 
            } 
            if (!this.pkgConfig.name) { 
                this.pkgConfig.name = this.constructor.name.toLowerCase(); 
            } 
        }

        return Util.finally(me.configure(args).then(() => {
            me.applyDefaults(params);
            me.beforeExecute(params);

            return me.askMissing(params).then(() => {
                me.showLogo();
                return me.execute(params, args);
            });
        }),
        () => {
            args.ownerPop(me);
        });
    }

    down (name) {
        var candidate = this.child;
        var is = (typeof name === 'function') ? name : (c => !name || c.name === name);

        while (candidate && !is(candidate)) {
            candidate = candidate.child;
        }

        return candidate;
    }

    isInteractive () {
        let candidate = this;
        while (candidate != null) {
            if (candidate.interactive) {
                return true;
            } else {
                candidate = candidate.up();
            }
        }
        return false;
    }

    leaf () {
        if (!this.child) {
            return this;
        }
        return this.child.leaf();
    }

    processArg (arg, args) {
        args.unpull(arg);
        return null;
    }

    raise (msg) {
        //TODO include context info like:
        //      ... while processing 'foo' switch for 'bar blerp'

        throw new Error(msg);
    }

    root () {
        if (!this.parent) {
            return this;
        }

        return this.parent.root();
    }

    /**
     * This method executes the commands described by the provided string arguments. This
     * method wraps the strings in an `Arguments` instance and delegates the work to the
     * `dispatch` method.
     * @param {Arguments|String...|Array} args The arguments to run.
     * @return {Promise} The Promise that resolves with the command result.
     */
    run (...args) {
        var a = args[0];

        if (args.length === 1) {
            if (a.isArguments || Array.isArray(a)) {
                args = a;
            }
        }
        else if (!args.length) {
            args = process.argv.slice(2);
        }

        a = args.isArguments ? args : new Arguments(args);

        return this.dispatch(a);
    }

    showLogo () {
        let me = this;
        let root = me.root();
        let rootCtor = root.constructor;
        

        if (me.isCommand && rootCtor._shouldShowLogo) {
            console.log(chalk.bold(root.logo));
            this.skipLogo();
        }
    }

    skipLogo () {
        this.constructor._shouldShowLogo = false;
    }

    up (name) {
        var candidate = this.parent;
        var is = (typeof name === 'function') ? name : (c => !name || c.name === name);

        while (candidate && !is(candidate)) {
            candidate = candidate.parent;
        }

        return candidate;
    }

    updateFromAnswers (answers, params) {
        for (let switchName of Object.keys(answers)) {
            let entry = this.switches.lookup(switchName);
            if (entry) {
                entry.setRaw(params, answers[switchName]);
                delete answers[switchName];
            }
        }
    }

    //---------------------------------------------------------------
    // Private
}

Object.assign(Cmdlet, {
    isCmdlet: true,
    idSeed: 0,

    _switches: new Switches(Cmdlet)
});

Object.assign(Cmdlet.prototype, {
    isCmdlet: true,

    child: null,
    parent: null
});

module.exports = Cmdlet;
