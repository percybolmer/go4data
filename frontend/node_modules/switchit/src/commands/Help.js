'use strict';

const columnify = require('columnify');
const marked = require('marked');
const chalk = require('chalk');
const MarkedTerminal = require('marked-terminal');
const stripAnsi = require('strip-ansi');
const wrapAnsi = require('wrap-ansi'); 

const Container = require('../Container');
const Command = require('../Command');

class Help extends Command {
    static columnify (items, linePadding = 2, linePrefix = '') {
        return columnify(items, {
            config: {
                name: {
                    minWidth: 25
                }, 
                help: { 
                    maxWidth: 50
                }
            },
            preserveNewLines: true,
            showHeaders: false
        }).split("\n").map((line) => `${' '.repeat(linePadding)}${line.startsWith(' ') || line.trim().startsWith('(') ? ' '.repeat(linePrefix.length) : linePrefix}${line}`).join("\n");
    }
    // --------------------------------

    beforeExecute (params) {
        super.beforeExecute(params);
        if (params.markdown && params.html) {
            this.raise('Conflicting switches "markdown" and "html" specify only one.');
        }
        this.root().skipLogo();
    }

    execute (params) {
        let me = this;

        me.out.reset();

        me.normalizeSubject(params);

        me.showHeader(params);
        me.showSyntax(params);
        me.showOptions(params);

        if (params.target.isContainer) {
            me.showCommands(params);
        }

        me.printOutput();
    }

    normalizeSubject (params) {
        let rootCmd = this.root();
        let target = rootCmd.constructor;

        if (params.subject.length === 0) {
            let parent = this.parent;
            if (rootCmd !== parent) {
                params.subject.push(parent.name);
            }
        }

        params.subject = params.subject.map((subject) => {
            target = target.commands.lookup(subject);
            if (!target) {
                this.raise(`No such command or category "${subject}"`);
            }
            let name = target.name;
            target = target.type;
            return name;
        });

        params.target = target;
    }

    showHeader (params) {
        let me = this,
            root = me.root(),
            rootCls = root.constructor,
            pkg = root.pkgConfig,
            target = params.target,
            name = target.name,
            help = target.help;

        if (rootCls === target) {
            params.subject = [name];
        } else { 
            params.subject.unshift(rootCls.name.toLowerCase()); 
        }

        if (rootCls === target) {
            this.out.appendLn(this.h1(root.logo));
        } else {
            this.out.appendLn(this.h2(`${params.subject.join(' ').toLowerCase()}`));
        } 
        if (help) { 
            this.out.appendLn(`  ${help}`); 
        }
    }

    showSyntax (params) {
        let subject = params.subject,
            fullName = subject.join(' ').toLowerCase(),
            target = params.target,
            aspects = target.getAspects(params.all);

        this.out.appendLn(this.h2('Usage'));

        let syntaxParts = [];
        if (target.isContainer) {
            if (aspects.defaultCmd) {
                syntaxParts.push(this.buildSyntaxPart(fullName, aspects.defaultCmd.help));
            }
        }

        syntaxParts.push(this.buildSyntaxPart(fullName, 'Runs [command]', aspects.switches.length, target.isContainer, aspects.parameters));
        this.out.appendLn(Help.columnify(syntaxParts)).appendLn();
    }

    buildSyntaxPart (name, help, hasOptions = false, isContainer = false, parameters = []) {
        if (hasOptions) {
            name = `${name} [options]`;
        }
        if (isContainer) {
            name = `${name} [command]`;
        }
        else if (parameters.length > 0) {
            let params = [];
            parameters.forEach((parameter) => {
                if (!parameter) return;
                params.push(`${parameter.optional ? '[' : ''}${parameter.name}${parameter.vargs ? '...' : ''}${parameter.optional ? ']' : ''}`);
            });
            name = `${name} ${params.join(' ')}`;
        }
        return {
            name: this.code(name),
            help: `${help}` || ''
        };
    }

    showOptions (params) {
        let me = this,
            target = params.target,
            aspects = target.getAspects(params.all);

        if (aspects.switches.length > 0) {
            let switchCount = 0;
            aspects.switches.sort((a,b) => {
                if (!a || !b) return 0;
                return a.name > b.name;
            }).forEach((s) => { if (s) {switchCount++;} });

            if (switchCount > 0) {
                me.out.appendLn(this.h2('Options:'));
                let options = [];
                aspects.switches.forEach(function (option) {
                    if (!option) return;
                    options.push(me.buildOptionPart(option));
                });
                options.forEach(function (opt) {
                    opt.help = `${chalk.dim(`_(${opt.type + (opt.vargs ? '...' : '')})_`)} ${opt.help}`;
                    delete opt.type;
                    delete opt.vargs;
                });
                me.out.appendLn(Help.columnify(options, 2, '· ')).appendLn();
            }

        }
    }

    buildOptionPart (option) {
        let name = option.name;
        let type = option.type;
        let help = option.help || '';
        let value = option.value;
        let vargs = option.vargs;
        let char = option.char;
        let required = option.required;
        return {
            name: (char ? this.code(`-${char}`) + ', ' : '') + this.code(`--${name}`),
            type: `${type}`,
            vargs: option.vargs,
            help: `${help}${(value !== undefined) ? (!!help ? '\n' : '') + chalk.dim('_(default: ' + (vargs ? '[]' : value) + ')_') : (required ? (!!help ? '\n' : '') + chalk.dim('_(required)_') : '')}` 
        };
    }

    showCommands (params) {
        let me = this,
            target = params.target,
            aspects = target.getAspects(params.all);

        if (aspects.commands.length > 0) {
            let hasContainers = false;
            let commandCount = 0;
            aspects.commands.sort((a,b) => {
                if (!a || !b) return 0;
                if (a.container || b.container) hasContainers = true;
                return a.name > b.name;
            }).forEach((c) => { if (c) {commandCount++;} });

            if (commandCount > 0) {
                me.out.append(this.h2("Commands"));
                if (hasContainers) {
                    me.out.append(` (${chalk.cyan('»')}: has sub-commands)`);
                }
                me.out.appendLn(":");
                let commands = [];
                aspects.commands.forEach(function (cmdlet) {
                    if (!cmdlet) return;
                    commands.push(me.buildCommandPart(cmdlet.name, cmdlet.help, cmdlet.container, cmdlet.aliases));
                });
                me.out.appendLn(Help.columnify(commands, 2, '· ')).appendLn().appendLn("Run " + this.code(`${this.fullName} [command]`) + " for more information on a command.");
            }
        }
    }

    buildCommandPart (name, help = '', isContainer = false, aliases) {
        return {
            name: `${this.code(name)}${isContainer ? ' ' + chalk.cyan('»') : ''}`,
            help: `${help}${aliases.length > 0 ? '\n'+ chalk.dim('_(also known as: ' + aliases.join(', ') + ')_'): ''}`
        };
    }

    printOutput () {
        let out = this.out.flush();

        if (!this.params.markdown) {
            if (!this.params.html) {
                marked.setOptions({
                    renderer: new MarkedTerminal({
                        showSectionPrefix: false,
                        firstHeading: chalk.bold,
                        heading: t => t
                    })
                });
            } else {
                marked.setOptions({
                    renderer: new marked.Renderer()
                });
            }
            out = marked(out);
        }

        if (!this.params.color) {
            out = stripAnsi(out);
        }

        console.log(out.split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').trim()); 
    }
}

Object.assign(Help.prototype, {
    out: {
        _buffer: [],

        LINE_BREAK: '\n',

        appendLn (str) {
            this.append(str);
            this.append(this.LINE_BREAK);
            return this;
        },

        append (str) {
            this._buffer.push(str);
            return this;
        },

        reset () {
            this._buffer = [];
            return this;
        },

        flush () {
            let out = this._buffer.join('');
            this.reset();
            return out.trim();
        }
    },

    h1 (str) {
        return `# ${str}`;
    },

    h2 (str) {
        return `## ${str}`;
    },

    code (str) {
        return `\`${str}\``;

    }
});

Help.define({
    help: {
        '': 'Display help for a given command',

        all: 'Display help for internal, experimental and private commands and switches',
        markdown: 'Display help in raw markdown syntax',
        html: 'Display help output in html',
        color: 'Use ANSI escape codes to colorize output',
        subject: 'The command or category for which to display help.'
    },

    switches: '[markdown:boolean=no] [all:boolean=no] [color:boolean=true] [html:boolean=false]',
    parameters: '[subject...]'
});
module.exports = Help;
