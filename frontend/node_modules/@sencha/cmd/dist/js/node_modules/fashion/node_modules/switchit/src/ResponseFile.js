"use strict";

const fs = require('fs');
const Path = require('path');

class ResponseFileLoader {
    box (arg, from) {
        return {
            arg: arg,
            from: from,
            isBox: true
        };
    }

    expand (arg) {
        const me = this;
        var from = me.baseDir;

        if (arg.isBox) {
            from = arg.from;
            arg = arg.arg;
        }

        if (arg[0] === '@' && arg.length > 1) {
            let filename = arg.substr(1);

            if (filename[0] !== '@') {
                filename = me.resolve(filename, from);
                from = Path.dirname(filename);

                let promise = me.read(filename).then(lines => {
                    // We need to box the lines so that we can know the response
                    // file from which they came in case they contain @foo lines
                    // that need to also be expanded. In this case, the file name
                    // will be processed relative to the response file from which
                    // the argument was read.
                    return lines.map(line => me.box(line, from));
                });
                
                promise.fileName = filename;
                return promise;
            }

            // interpret "@@foo" to mean literal "@foo"
            arg = filename;
        }

        return Promise.resolve(arg);
    }

    parse (text) {
        if (this.crlfRe.test(text)) {
            text = text.replace(this.crlfRe, '\n');
        }

        var lines = text.split('\n'),
            ret = [];

        for (let line of lines) {
            line = line.trim();

            // Skip lines like:
            //
            //      # Foo bar comment
            //
            let m = this.commentRe.exec(line);
            if (m) {
                line = m[1].trim();
                if (line[0] !== '#') {
                    continue;
                }

                // But keep lines like:
                //
                //      ##somearg
                //
                // After stripping the leading '#' (so keep '#somearg')
            }

            if (line) {
                ret.push(line);
            }
        }

        return ret;
    }

    read (filename) {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.parse(data));
                }
            });
        });
    }

    resolve (filename, from) {
        return Path.resolve(from || this.baseDir, filename);
    }
}

Object.assign(ResponseFileLoader.prototype, {
    baseDir: process.cwd(),
    commentRe: /^\s*#(.*)$/,
    crlfRe: /\r\n/g
});

module.exports = ResponseFileLoader;
