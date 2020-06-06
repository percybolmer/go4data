/*
 * Copyright (c) 2012-2016. Sencha Inc.
 */

var system = require('system'),
    fs = require('fs');

var args = system.args,
    script = system.args[0].replace(/\\/g, '/'),
    fashionDir = script.substring(0, script.lastIndexOf('/')),
    scssFile = args[1].replace(/\\/g, '/'),
    output = args[2].replace(/\\/g, '/'),
    optionsFile = args[3],
    saveFile = args[4],
    exit = function (code, err) {
        // NOTE: PhantomJS get cranky w/o this log statement (timing maybe?)
        console.log('PhantomJS exiting with code', code);
        Fashion.Env.fs = fsWas;
        if (err) {
            var message = (err.stack || err) + '';
            console.log(message);
        }
        phantom.exit(code || 0);
    },
    Fashion = require(fashionDir + '/fashion/fashion-phantomjs.js'),
    fsWas = Fashion.Env.fs,
    options = {
        path: scssFile,
        compress: false,
        split: 0xFFFFFFFF,
        outputPath: output
    },
    variables;

try {
    Fashion.Env.fs = fs;
    Fashion.Env.isBrowser = false;
    Fashion.Env.isRhino = true;
    Fashion.Env.readFileRhino = function(file) {
        return fs.read(file);
    };

    Fashion.Env.loadFileRhino = function(file, success, error) {
        var content, exception;
        try {
            content = Fashion.Env.readFile(file);
        } catch (err) {
            exception = err;
        }
        if (exception) {
            error(exception);
        } else {
            success(content);
        }
    };

    if (optionsFile) {
        if (fs.exists(optionsFile)) {
            var content = fs.read(optionsFile);
            var config = JSON.parse(content);
            for (var key in config) {
                options[key] = config[key];
            }
        }
        else {
            console.log("specified options file : " + optionsFile + ' did not exist');
        }
    }

    if (saveFile && fs.exists(saveFile)) {
        var content = fs.read(saveFile);
        if (/\.json$/.test(saveFile)) {
            variables = JSON.parse(content);
        }
        else {
            variables = {};
            var regex = /(.*?):(.*?);?$/gim,
                matches;

            while((matches = regex.exec(content))) {
                variables[matches[1]] = matches[2];
            }
        }
    }

    options.variables = variables;

    var basePath = output.replace(/\\/g, '/');
    basePath = basePath.substring(0, basePath.lastIndexOf('/'));
    options.basePath = basePath;

    function build() {
        var builder = new Fashion.Builder({
                context: Fashion.merge({
                    libraries: {
                        compass: fashionDir + '/lib/compass/stylesheets/',
                        blueprint: fashionDir + '/lib/blueprint/stylesheets/'
                    }
                }, options)
            });

        try {
            var raiseWas = Fashion.raise;
            Fashion.raise = function(ex){
                builder.exception = ex;
                raiseWas.call(this, ex);
            };

            builder.context.basePath = basePath;

            builder.build(options, function(generated, err, exportFn) {

                var ex = err || builder.exception;
                if (ex) {
                    exit(3, ex);
                }

                try {
                    var idx = output.lastIndexOf('/'),
                        baseName = output.substring(0, idx);

                    if (!Array.isArray(generated) || generated.length === 1) {
                        if (Array.isArray(generated)) {
                            generated = generated[0];
                        }
                        fs.write(output, generated);
                    }
                    else {
                        var fileName = output.substring(idx + 1),
                            newContent = '';
                        for (var i = 0; i < generated.length; i++) {
                            var content = generated[i],
                                newName = fileName.replace(/\.css$/g, '_' + (i + 1) + '.css');
                            fs.write(baseName + '/' + newName, content);
                            newContent += "@import '" + newName + "';\n";
                        }
                        fs.write(output, newContent);
                    }
                    if (exportFn) {
                        var fnFileName = baseName + '/css-vars.js';
                        fs.write(fnFileName, exportFn);
                    }
                    exit(0);
                } catch (err) {
                    exit(4, err);
                }
            });
        } catch (err) {
            exit(2, err);
        }
    }

    build();
} catch (err) {
    exit(1, err);
}
