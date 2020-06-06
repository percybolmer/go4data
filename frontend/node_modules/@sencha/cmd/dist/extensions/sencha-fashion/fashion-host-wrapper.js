// @require fashion/fashion-phantomjs.js

importPackage(com.sencha.util);

Fashion.Env.readFileRhino = function(file) {
    return FileUtil.readUnicodeFile(file) + '';
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

Fashion.mainbuilder = Fashion.mainbuilder || new Fashion.Builder({
    context: {
        libraries: {
            compass: compassPath,
            blueprint: blueprintPath
        }
    }
});

function fashionBuild(inputFile, callback) {
    var builder = Fashion.mainbuilder,
        syntax, sassFile;

    sassFile = builder.getSassFile(inputFile);
    sassFile.invalidate();
    sassFile.onReady(function(){
        callback(fashionConvert(sassFile.getExpandedAst()));
        syntax = sassFile.getExpandedAst();
    });
};

function fashionTokenize(sass) {
    return new Fashion.parse.Tokenizer().tokenize(sass);
}


function removeTokens(obj) {
    if (obj && !obj.__processing) {
        obj.__processing = true;
        delete obj.token;
        for (var name in obj) {
            var val = obj[name];
            if (Array.isArray(val)) {
                val.forEach(function(obj){
                    removeTokens(obj);
                });
            }
            else {
                removeTokens(val);
            }
        }
        delete obj.__processing;
    }
    return obj;
}

function fashionParse(sass) {
    var parser = new Fashion.parse.Parser(),
        ast = parser.parse(sass);
    ast = removeTokens(ast);
    return ast;
}

function fashionConvert(syntax) {
    return Fashion.mainbuilder.context.convert(syntax);
}

function fashionRun(js) {
    return Fashion.mainbuilder.context.run(js);
}

function fashionGetCss(js) {
    var future = new ThreadUtil.SettableFuture();
    fashionRun(js).getText(function(generated){
        future.set(generated.join(''));
    });
    return future.get() + '';
}

function fashionCompile(syntax) {
    return fashionRun(fashionConvert(syntax));
}

function fashionCompileCss(sass) {
    return fashionCompile(fashionParse(fashionTokenize(sass))).getText();
}

function jsonEncode(obj) {
    return JSON.stringify(obj, ignoreLineNumber, 4);
}

function fashionFullCompile(path) {
    var future = new ThreadUtil.SettableFuture();
    fashionBuild(path, function(converted){
        var func = Fashion.mainbuilder.context.runtime.compile(converted),
            css = func();

        css.getText(function(generated){
            if (Array.isArray(generated)) {
                generated = generated.join('');
            }
            future.set(generated);
        });
    });

    return future.get() + '';
}

function setOptionsFile (optionsFile) {
    if (FileUtil.isFile(optionsFile)) {
        var options = {
            libraries: {
                compass: compassPath,
                blueprint: blueprintPath
            }
        };
        var content = FileUtil.readUnicodeFile(optionsFile) + '';
        var config = JSON.parse(content);
        for (var key in config) {
            options[key] = config[key];
        }
        Fashion.mainbuilder = new Fashion.Builder({
            context: options
        });
    }
    else {
        console.log("specified options file : " + optionsFile + ' did not exist');
    }
}