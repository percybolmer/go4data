/*
 * Copyright (c) 2012-2015. Sencha Inc.
 */
var page = require('webpage').create(),
    system  = require('system'),
    fs = require('fs');

/**
 *  error handler logic, updates should be below this section
 */
page.onConsoleMessage = function (msg) {
    console.log(msg);
};

function handleError (err, stack) {
    console.log("== Unhandled Error ==");
    phantom.defaultErrorHandler(err, stack);
    phantom.exit(2);
}

page.onError = phantom.onError = handleError;

/* end error handler setup */

page.onCallback = function(message) {
    var type = message.type;
    if(type == 'screenshot') {
        var path = message.path;
        console.log('Saving slicer page image to ' + path);
        page.render(path);
    } else if(type == 'manifest') {
        var data = message.data,
            path = message.path;
        console.log('Saving slicer widget manifest to ' + path);
        fs.write(path, JSON.stringify(data, null, '  '), 'w');
    } else if(type == 'shutdown') {
        phantom.exit(0);
    } else if(type == "save") {
        var data = message.data,
            path = message.path;
        console.log("saving data to " + path);
        fs.write(path, data, "w");
    }
};



if (system.args.length < 1) {
    console.log("usage:");
    console.log("\tsass-page-loader.js <path to html file>:");
    phantom.exit(1);
}

/**
 * args:
 * 0 => this script's file name
 * 1 => the html file to render (on windows, be mindful of '\\' chars)
 */
var url = system.args[1].replace(/\\/g, "/"),
    index = url.indexOf("?"),
    param = "phantomjs=true";

if(index > -1) {
    url = url + "&" + param;
} else {
    url = url + "?" + param;
}

console.log("loading page " + url);

function waitFor (test, ready, timeout) {
    var maxtimeOutMillis = timeout ? timeout : 30 * 1000,
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
                condition = test();
            } else {
                clearInterval(interval);
                if (!condition) {
                    console.log('failed to render widgets within 30 sec.');
                    phantom.exit(1);
                } else {
                    ready();
                }
            }
        }, 100);
}

try {
page.open(url, function (status) {
    if (status === 'success') {
        console.log("successfully loaded page " + url);
        page.evaluate(function() {
            console.log('loading phantomjs adapter');
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', function () {
                    // This is very important for getting transparency on corners.
                    document.body.style.backgroundColor = 'transparent';
                });
            }
            document.body.style.backgroundColor = 'transparent';
            window.generateSlicerManifest = function() {
                var elements = document.body.querySelectorAll('.x-slicer-target');
                var widgets = [];
                var slicesRe = /^'x-slicer\:(.+)'$/;
                var transparentRe = /^rgba\(.*[,]\s*0\)$/i;
                var urlRe = /url[(]([^)]+)[)]/;

                function getData (el) {
                    var data = el.getAttribute('data-slicer');
                    if (data) {
                        return JSON.parse(data);
                    }
                    return null;
                }

                function getSlices (entry, el) {
                    // ext-5.0.1 switched to using :before pseudo el to convey framing info.
                    // Check both before and after for compatibility with previous versions.
                    // Also, 5.0.1 added a "x-cmd-slicer" class to these selectors so that
                    // they only activate when we add that class here (thus avoiding conflicts
                    // with all use of pseudo elements).

                    var currentCls = el.className;

                    el.className = 'x-cmd-slicer ' + el.className;

                    var content = slicesRe.exec(window.getComputedStyle(el, ':before').content),
                        slices = entry.slices;

                    if (!content) {
                        content = slicesRe.exec(window.getComputedStyle(el, ':after').content);
                    }

                    el.className = currentCls;

                    content = content && content[1];

                    if (content) {
                        var sliceStrings = content.split(', ');
                        forEach(sliceStrings, function(str){
                            // Each string looks like a url, with a schema, followed by some 'other' string, either a path or
                            // some other token
                            var colon = str.indexOf(':');
                            if (colon == -1) return;
                            var schema = str.slice(0, colon);
                            var path = str.slice(colon + 1);
                            if (schema == "stretch") {
                                // The stretch property is used to modify other slices for this widget, store it on its own
                                entry.stretch = path;
                            } else if (schema === 'frame') {
                                var frame = path.split(' ');
                                entry.frame = {
                                    t: parseInt(frame[0], 10),
                                    r: parseInt(frame[1], 10),
                                    b: parseInt(frame[2], 10),
                                    l: parseInt(frame[3], 10)
                                };
                            } else {
                                // The path indicates the desired output file to create for this type of slice operation
                                if (!!slices[schema] && 'url(' + slices[schema] + ')' != path) {
                                    err("The widget " + entry.id + " declares two " + schema + " with two different urls");
                                }
                                // From SASS, this path is in the form of url(path), whereas we only want to pass along the inner
                                // part of the path
                                var urlMatch = urlRe.exec(path);
                                if (urlMatch && urlMatch[1]) {
                                    slices[schema.replace(/-/g,'_')] = urlMatch[1];
                                } else {
                                    err("The widget " + entry.id + "'s " + schema + " slice's url cannot be parsed: " + path);
                                }
                            }
                        });
                    }
                }

                function err (str) {
                    console.error(str);
                    throw new Error(str);
                }

                function forEach (it, fn) {
                    for (var i = 0; i < it.length; ++i) {
                        fn(it[i]);
                    }
                }

                function copyProps (dest, src) {
                    var out = dest || {};
                    if (!!src) {
                        for (var key in src) {
                            var val = src[key];
                            if (typeof(val) == "object") {
                                out[key] = copyProps(out[key], val);
                            } else {
                                out[key] = val;
                            }
                        }
                    }

                    return out;
                }

                forEach(elements, function (el) {
                    var view = el.ownerDocument.defaultView;
                    var style = view.getComputedStyle(el, null);
                    var bg = style['background-image'];
                    var box = el.getBoundingClientRect();

                    var entry = {
                        box: {
                            x: window.scrollX + box.left,
                            y: window.scrollY + box.top,
                            w: box.right - box.left,
                            h: box.bottom - box.top
                        },
                        radius: {
                            tl: parseInt(style['border-top-left-radius'], 10) || 0,
                            tr: parseInt(style['border-top-right-radius'], 10) || 0,
                            br: parseInt(style['border-bottom-right-radius'], 10) || 0,
                            bl: parseInt(style['border-bottom-left-radius'], 10) || 0
                        },
                        border: {
                            t: parseInt(style['border-top-width'], 10) || 0,
                            r: parseInt(style['border-right-width'], 10) || 0,
                            b: parseInt(style['border-bottom-width'], 10) || 0,
                            l: parseInt(style['border-left-width'], 10) || 0
                        }
                    };

                    if (bg.indexOf('-gradient') !== -1) {
                        if (bg.indexOf('50% 0') !== -1 || bg.indexOf('top') !== -1 ||
                            bg.indexOf('bottom') !== -1) {
                            entry.gradient = 'top';
                        } else {
                            entry.gradient = 'left';
                        }
                    }

                    // Reads from sass to get data
                    entry.slices = {};
                    getSlices(entry, el);

                    if (!!el.id) {
                        entry.id = el.id;

                        // Merge with existing properties in global widgetSlices array, favoring widgetSlices
                        if (!!window.widgetSlices) {
                            entry = copyProps((window.widgetSlices && window.widgetSlices[el.id]), entry);
                            delete window.widgetSlices[el.id];
                        }
                    }

                    if (!entry.gradient && !entry.slices.length &&
                        transparentRe.test(style['background-color']) &&
                        transparentRe.test(style['border-top-color']) &&
                        transparentRe.test(style['border-right-color']) &&
                        transparentRe.test(style['border-bottom-color']) &&
                        transparentRe.test(style['border-left-color'])) {
                        // If we have no gradient and the background and border are both
                        // transparent, the Sass is allowed to have no slices. If we do
                        // the push on this entry, the slicer core will generate warnings
                        // about it. This is a Good Thing and we don't want to blindly
                        // mask legitimate issues such as not sending in the proper slice
                        // requests.
                        return;
                    }

                    widgets.push(entry);
                });

                if (!!window.widgetSlices) {
                    for (var id in window.widgetSlices) {
//                        widgets.push(window.widgetSlices[id]);
                        console.error("Widget Slice detected without corresponding element : " + id);
                    }
                }

                var slicerManifest = window.slicerManifest = getData(document.body) || {};
                slicerManifest.widgets = widgets;
                if (!slicerManifest.format) {
                    // legacy support sets format to "1.0"
                    slicerManifest.format = '2.0';
                }
                window['widgetsReady'] = true;
                return slicerManifest;
            };

            window.captureWidgetManifest = function(path){
                window.callPhantom({
                    type: 'manifest',
                    path: path,
                    data: window.generateSlicerManifest()
                });
            };
            
            window.capturePageImage = function(path){
                window.callPhantom({
                    type: 'screenshot',
                    path: path
                });
            };
            
            if(window['SassBuilder']) {
                var fn = SassBuilder.capturePageImage;
                SassBuilder.capturePageImage =  window.capturePageImage;
                SassBuilder.captureWidgetManifest = window.captureWidgetManifest;
                if(fn) {
                    fn();
                }
                SassBuilder.onClientShutdown = function(update) {
                    window.callPhantom({
                        type: 'shutdown'
                    });
                };
                SassBuilder.beginLiveUpdateMonitor();
            }
            
        });
    } else {
        console.log('Failed to load page');
        phantom.exit(100);
    }
});
} catch (error) {
    console.log("Error opening page : " + url);
    console.log(error);
    phantom.exit(200);
}

