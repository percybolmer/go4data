/***************************************************************
 * resolver.js
 * This is a phantomjs script that extracts the Ext.Loader
 * load history from a running page.
 ***************************************************************/

function success(message) {
    console.log(message);
    phantom.exit(0);
}

function error(message) {
    console.log(message);
    phantom.exit(1);
}

var args = phantom.args,
    uri = args[0],
    outfile = args[1],
    elapse = 0,
    dependencies, timer,
    page = require('webpage').create(),
    system  = require('system'),
    fs = require('fs');

/**
 *  error handler logic, updates should be below this section
 */
page.onConsoleMessage = function(msg){
  console.log(msg);
};

function handleError(err, stack) {
    console.log("== Unhandled Error ==");
    phantom.defaultErrorHandler(err, stack);
    phantom.exit(2);
}

function waitFor(test, ready, timeout) {
    var maxtimeOutMillis = timeout ? timeout : 30 * 1000,
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
                condition = test();
            } else {
                if (!condition) {
                    console.log('failed to recieve sync condition within 30 sec.');
                    phantom.exit(1);
                } else {
                    clearInterval(interval);
                    ready();
                }
            }
        }, 100);
}

page.onError = phantom.onError = handleError;

page.settings.localToRemoteUrlAccessEnabled = true;
page.settings.ignoreSslErrors = true;
page.settings.webSecurityEnabled = false;

console.log("opening uri : " + uri);

/*
 * This function wraps WebPage.evaluate, and offers the possibility to pass
 * parameters into the webpage function. The PhantomJS issue is here:
 * 
 *   http://code.google.com/p/phantomjs/issues/detail?id=132
 * 
 * This is from comment #43.
 * Author: Stepan Riha
 *
 * H/T: Weston - http://stackoverflow.com/questions/9838119/pass-arguments-with-page-evaluate
 * 
 * NOTE: Phantom 1.6 has a fix for this. Our current version is 1.5.1
 */
function evaluate (page, func) {
    var args = [].slice.call(arguments, 2);
    var fn = "function() { return (" + func.toString() + ").apply(this, " + JSON.stringify(args) + ");}";
    return page.evaluate(fn);
}

page.open(uri, function(status) {
    if (status !== 'success') {
        error("Failed opening: '" + uri + "', please verify that the URI is valid");
    }

    console.log("initializing dependency capture mechanism...");
    
    evaluate(page, function(){
        window.captureDependencies = function() {
            var documentLocation = document.location,
                currentLocation = documentLocation.origin + documentLocation.pathname + documentLocation.search,
                dependencies = [], depCfg = {},
                path;

            function getRelativePath(from, to) {
                var fromParts = from.split('/'),
                    toParts = to.split('/'),
                    index = null,
                    i, ln;

                for (i = 0, ln = toParts.length; i < ln; i++) {
                    if (toParts[i] !== fromParts[i]) {
                        index = i;
                        break;
                    }
                }

                if (index === null || index === 0) {
                    return from;
                }

                fromParts = fromParts.slice(index);

                for (i = 0; i < ln - index - 1; i++) {
                    fromParts.unshift('..');
                }

                for (i = 0, ln = fromParts.length; i < ln; i++) {
                    if (fromParts[i] !== '..' && fromParts[i+1] === '..') {
                        fromParts.splice(i, 2);
                        i -= 2;
                        ln -= 2;
                    }
                }

                fromParts = fromParts.map(function(part){
                    return decodeURIComponent(part);
                });

                return fromParts.join('/');
            }
            
            Ext.Loader.history.forEach(function(item) {
                path = Ext.Loader.getPath(item);
                path = getRelativePath(path, currentLocation);
                
                depCfg = {
                    path: path,
                    className: item
                };
                
                dependencies.push(depCfg);
            });
            
            Ext.__dependencies = dependencies;
        }
    });

    console.log("waiting for Ext");
    
    waitFor(function(){
        return page.evaluate(function(){
            return !!(window && window.Ext && window.Ext.Loader && !window.Ext.Loader.isLoading);
        });
    }, function(){
        try {
            page.evaluate(function() {
                Ext.onReady(window.captureDependencies);
            });

            console.log("waiting for dependency info capture...");

            waitFor(function(){
                return page.evaluate(function() {
                    return !!(window['Ext'] && window['Ext']['__dependencies']);
                });
            }, function(){
                try {
                    var dependencies = page.evaluate(function() {
                        return Ext.__dependencies;
                    });
                    
                    if (dependencies) {
                        var jsonData = JSON.stringify(dependencies, null, 4);
                        fs.write(outfile, jsonData);
                    }

                    phantom.exit();
                } catch (e) {
                    error("Error extracting dependency information : " + e);
                    phantom.exit(2);
                }
            });

        } catch(e) {
            error("Error synchronizing with Ext.onReady" + e);
            phantom.exit(1);
        }
    });
});
