/*
 * Copyright (c) 2012-2013. Sencha Inc.
 * 
 * This is a PhantomJS script that renders a running page and captures both a screenshot
 * of the rendered page and a data snapshot of the ComponentManager's set of rendered
 * widgets. This data is then used to extract theme images.
 */
var page = require('webpage').create(),
    system  = require('system'),
    fs = require('fs'),
    screenCapFileName,
    widgetDataFile,
    baseDir;

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
    if(type == 'manifest') {
        var data = message.data;
        console.log('Saving slicer widget manifest to ' + widgetDataFile);
        fs.write(widgetDataFile, JSON.stringify(data, null, '  '), 'w');
        console.log('Saving slicer page image to ' + screenCapFileName);
        page.render(screenCapFileName);
        phantom.exit(0);
    } else if(type == 'shutdown') {
        phantom.exit(message.code || 0);
    }
};


if (system.args.length < 2) {
    console.log("usage:");
    console.log("\tsencha slice capture -page <path to html file> [-image-file <image name> -widget-file <widget data file>]:");
    phantom.exit(1);
}

/**
 * args:
 * 0 => this script's file name
 * 1 => the html file to render (on windows, be mindful of '\\' chars)
 * 2 => the name of the screen shot image (default: screenshot.png)
 * 3 => the name of the widget data file (default: widgetdata.json)
 */
var url = system.args[1].replace(/\\/g, "/");

screenCapFileName = ((system.args.length > 2) && system.args[2]) || "screenshot.png",
widgetDataFile = ((system.args.length > 3) && system.args[3]) || "widgetdata.json";
baseDir = system.args[4];

// ensure a leading / event on windows
if (url.indexOf("/") !== 0) {
    url = "/" + url;
}

if (url.indexOf("file://") !== 0) {
    url = "file://" + url;
}

if (baseDir) {
    baseDir = baseDir.replace(/\\/g, '/');
    var idx = url.indexOf("?");
    sep = idx > -1 ? "&" : "?";
    if (baseDir[1] === ':' ) {
        // phantomjs needs a triple slash before the path to correctly load absolute paths
        baseDir = "file:///" + baseDir;
    }
    url = url + sep + "_baseDir=" + encodeURIComponent(baseDir);
}

console.log("loading page " + url);

page.open(url, function (status) {
    if (status === 'success') {
        page.evaluate(function() {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', function () {
                    // This is very important for getting transparency on corners.
                    document.body.style.backgroundColor = 'transparent';
                });
            }
            document.body.style.backgroundColor = 'transparent';

            function genSlicerManifest () {
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
                            x: Math.floor(window.scrollX + box.left),
                            y: Math.floor(window.scrollY + box.top),
                            w: Math.ceil(box.right - box.left),
                            h: Math.ceil(box.bottom - box.top)
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

                return slicerManifest;
            };

            function complete(manifest) {
                clearInterval(interval);
                window.callPhantom({
                    type: 'manifest',
                    data: manifest
                });
            }

            window.generateSlicerManifest = function() {
                setTimeout(function(){
                    var manifest = genSlicerManifest();
                    complete(manifest);
                }, 100);
            };

            var start = new Date().getTime(),
                interval = setInterval(function() {
                    var now = new Date().getTime();
                    if (!!window.widgetsReady) {
                        clearInterval(interval);
                        var manifest = window.slicerManifest;
                        if (!manifest) {
                            window.generateSlicerManifest();
                        }
                    }
                    else if ((now - start) > 30000) {
                        clearInterval(interval);
                        console.log("timeout rendering widgets");
                        window.callPhantom({
                            type: 'shutdown',
                            code: 1
                        });
                    }
                }, 100);
        });
    } else {
        console.log('Failed to load page');
        phantom.exit(100);
    }
});
