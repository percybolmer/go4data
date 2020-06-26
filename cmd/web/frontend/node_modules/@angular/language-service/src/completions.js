/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/language-service/src/completions", ["require", "exports", "tslib", "@angular/compiler", "@angular/compiler/src/chars", "@angular/language-service/src/expression_diagnostics", "@angular/language-service/src/expressions", "@angular/language-service/src/html_info", "@angular/language-service/src/template", "@angular/language-service/src/types", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var chars_1 = require("@angular/compiler/src/chars");
    var expression_diagnostics_1 = require("@angular/language-service/src/expression_diagnostics");
    var expressions_1 = require("@angular/language-service/src/expressions");
    var html_info_1 = require("@angular/language-service/src/html_info");
    var template_1 = require("@angular/language-service/src/template");
    var ng = require("@angular/language-service/src/types");
    var utils_1 = require("@angular/language-service/src/utils");
    var HIDDEN_HTML_ELEMENTS = new Set(['html', 'script', 'noscript', 'base', 'body', 'title', 'head', 'link']);
    var HTML_ELEMENTS = html_info_1.elementNames().filter(function (name) { return !HIDDEN_HTML_ELEMENTS.has(name); }).map(function (name) {
        return {
            name: name,
            kind: ng.CompletionKind.HTML_ELEMENT,
            sortText: name,
        };
    });
    var ANGULAR_ELEMENTS = [
        {
            name: 'ng-container',
            kind: ng.CompletionKind.ANGULAR_ELEMENT,
            sortText: 'ng-container',
        },
        {
            name: 'ng-content',
            kind: ng.CompletionKind.ANGULAR_ELEMENT,
            sortText: 'ng-content',
        },
        {
            name: 'ng-template',
            kind: ng.CompletionKind.ANGULAR_ELEMENT,
            sortText: 'ng-template',
        },
    ];
    // This is adapted from packages/compiler/src/render3/r3_template_transform.ts
    // to allow empty binding names.
    var BIND_NAME_REGEXP = /^(?:(?:(?:(bind-)|(let-)|(ref-|#)|(on-)|(bindon-)|(@))(.*))|\[\(([^\)]*)\)\]|\[([^\]]*)\]|\(([^\)]*)\))$/;
    var ATTR;
    (function (ATTR) {
        // Group 1 = "bind-"
        ATTR[ATTR["KW_BIND_IDX"] = 1] = "KW_BIND_IDX";
        // Group 2 = "let-"
        ATTR[ATTR["KW_LET_IDX"] = 2] = "KW_LET_IDX";
        // Group 3 = "ref-/#"
        ATTR[ATTR["KW_REF_IDX"] = 3] = "KW_REF_IDX";
        // Group 4 = "on-"
        ATTR[ATTR["KW_ON_IDX"] = 4] = "KW_ON_IDX";
        // Group 5 = "bindon-"
        ATTR[ATTR["KW_BINDON_IDX"] = 5] = "KW_BINDON_IDX";
        // Group 6 = "@"
        ATTR[ATTR["KW_AT_IDX"] = 6] = "KW_AT_IDX";
        // Group 7 = the identifier after "bind-", "let-", "ref-/#", "on-", "bindon-" or "@"
        ATTR[ATTR["IDENT_KW_IDX"] = 7] = "IDENT_KW_IDX";
        // Group 8 = identifier inside [()]
        ATTR[ATTR["IDENT_BANANA_BOX_IDX"] = 8] = "IDENT_BANANA_BOX_IDX";
        // Group 9 = identifier inside []
        ATTR[ATTR["IDENT_PROPERTY_IDX"] = 9] = "IDENT_PROPERTY_IDX";
        // Group 10 = identifier inside ()
        ATTR[ATTR["IDENT_EVENT_IDX"] = 10] = "IDENT_EVENT_IDX";
    })(ATTR || (ATTR = {}));
    // Microsyntax template starts with '*'. See https://angular.io/api/core/TemplateRef
    var TEMPLATE_ATTR_PREFIX = '*';
    function isIdentifierPart(code) {
        // Identifiers consist of alphanumeric characters, '_', or '$'.
        return chars_1.isAsciiLetter(code) || chars_1.isDigit(code) || code == chars_1.$$ || code == chars_1.$_;
    }
    /**
     * Gets the span of word in a template that surrounds `position`. If there is no word around
     * `position`, nothing is returned.
     */
    function getBoundedWordSpan(templateInfo, position) {
        var template = templateInfo.template;
        var templateSrc = template.source;
        if (!templateSrc)
            return;
        // TODO(ayazhafiz): A solution based on word expansion will always be expensive compared to one
        // based on ASTs. Whatever penalty we incur is probably manageable for small-length (i.e. the
        // majority of) identifiers, but the current solution involes a number of branchings and we can't
        // control potentially very long identifiers. Consider moving to an AST-based solution once
        // existing difficulties with AST spans are more clearly resolved (see #31898 for discussion of
        // known problems, and #33091 for how they affect text replacement).
        //
        // `templatePosition` represents the right-bound location of a cursor in the template.
        //    key.ent|ry
        //           ^---- cursor, at position `r` is at.
        // A cursor is not itself a character in the template; it has a left (lower) and right (upper)
        // index bound that hugs the cursor itself.
        var templatePosition = position - template.span.start;
        // To perform word expansion, we want to determine the left and right indices that hug the cursor.
        // There are three cases here.
        var left, right;
        if (templatePosition === 0) {
            // 1. Case like
            //      |rest of template
            //    the cursor is at the start of the template, hugged only by the right side (0-index).
            left = right = 0;
        }
        else if (templatePosition === templateSrc.length) {
            // 2. Case like
            //      rest of template|
            //    the cursor is at the end of the template, hugged only by the left side (last-index).
            left = right = templateSrc.length - 1;
        }
        else {
            // 3. Case like
            //      wo|rd
            //    there is a clear left and right index.
            left = templatePosition - 1;
            right = templatePosition;
        }
        if (!isIdentifierPart(templateSrc.charCodeAt(left)) &&
            !isIdentifierPart(templateSrc.charCodeAt(right))) {
            // Case like
            //         .|.
            // left ---^ ^--- right
            // There is no word here.
            return;
        }
        // Expand on the left and right side until a word boundary is hit. Back up one expansion on both
        // side to stay inside the word.
        while (left >= 0 && isIdentifierPart(templateSrc.charCodeAt(left)))
            --left;
        ++left;
        while (right < templateSrc.length && isIdentifierPart(templateSrc.charCodeAt(right)))
            ++right;
        --right;
        var absoluteStartPosition = position - (templatePosition - left);
        var length = right - left + 1;
        return { start: absoluteStartPosition, length: length };
    }
    function getTemplateCompletions(templateInfo, position) {
        var result = [];
        var htmlAst = templateInfo.htmlAst, template = templateInfo.template;
        // The templateNode starts at the delimiter character so we add 1 to skip it.
        var templatePosition = position - template.span.start;
        var path = utils_1.getPathToNodeAtPosition(htmlAst, templatePosition);
        var mostSpecific = path.tail;
        if (path.empty || !mostSpecific) {
            result = elementCompletions(templateInfo);
        }
        else {
            var astPosition_1 = templatePosition - mostSpecific.sourceSpan.start.offset;
            mostSpecific.visit({
                visitElement: function (ast) {
                    var startTagSpan = utils_1.spanOf(ast.sourceSpan);
                    var tagLen = ast.name.length;
                    // + 1 for the opening angle bracket
                    if (templatePosition <= startTagSpan.start + tagLen + 1) {
                        // If we are in the tag then return the element completions.
                        result = elementCompletions(templateInfo);
                    }
                    else if (templatePosition < startTagSpan.end) {
                        // We are in the attribute section of the element (but not in an attribute).
                        // Return the attribute completions.
                        result = attributeCompletionsForElement(templateInfo, ast.name);
                    }
                },
                visitAttribute: function (ast) {
                    // An attribute consists of two parts, LHS="RHS".
                    // Determine if completions are requested for LHS or RHS
                    if (ast.valueSpan && utils_1.inSpan(templatePosition, utils_1.spanOf(ast.valueSpan))) {
                        // RHS completion
                        result = attributeValueCompletions(templateInfo, path);
                    }
                    else {
                        // LHS completion
                        result = attributeCompletions(templateInfo, path);
                    }
                },
                visitText: function (ast) {
                    // Check if we are in a entity.
                    result = entityCompletions(getSourceText(template, utils_1.spanOf(ast)), astPosition_1);
                    if (result.length)
                        return result;
                    result = interpolationCompletions(templateInfo, templatePosition);
                    if (result.length)
                        return result;
                    var element = path.first(compiler_1.Element);
                    if (element) {
                        var definition = compiler_1.getHtmlTagDefinition(element.name);
                        if (definition.contentType === compiler_1.TagContentType.PARSABLE_DATA) {
                            result = voidElementAttributeCompletions(templateInfo, path);
                            if (!result.length) {
                                // If the element can hold content, show element completions.
                                result = elementCompletions(templateInfo);
                            }
                        }
                    }
                    else {
                        // If no element container, implies parsable data so show elements.
                        result = voidElementAttributeCompletions(templateInfo, path);
                        if (!result.length) {
                            result = elementCompletions(templateInfo);
                        }
                    }
                },
                visitComment: function () { },
                visitExpansion: function () { },
                visitExpansionCase: function () { }
            }, null);
        }
        var replacementSpan = getBoundedWordSpan(templateInfo, position);
        return result.map(function (entry) {
            return tslib_1.__assign(tslib_1.__assign({}, entry), { replacementSpan: replacementSpan });
        });
    }
    exports.getTemplateCompletions = getTemplateCompletions;
    function attributeCompletions(info, path) {
        var attr = path.tail;
        var elem = path.parentOf(attr);
        if (!(attr instanceof compiler_1.Attribute) || !(elem instanceof compiler_1.Element)) {
            return [];
        }
        // TODO: Consider parsing the attrinute name to a proper AST instead of
        // matching using regex. This is because the regexp would incorrectly identify
        // bind parts for cases like [()|]
        //                              ^ cursor is here
        var bindParts = attr.name.match(BIND_NAME_REGEXP);
        var isTemplateRef = attr.name.startsWith(TEMPLATE_ATTR_PREFIX);
        var isBinding = bindParts !== null || isTemplateRef;
        if (!isBinding) {
            return attributeCompletionsForElement(info, elem.name);
        }
        var results = [];
        var ngAttrs = angularAttributes(info, elem.name);
        if (!bindParts) {
            // If bindParts is null then this must be a TemplateRef.
            results.push.apply(results, tslib_1.__spread(ngAttrs.templateRefs));
        }
        else if (bindParts[ATTR.KW_BIND_IDX] !== undefined ||
            bindParts[ATTR.IDENT_PROPERTY_IDX] !== undefined) {
            // property binding via bind- or []
            results.push.apply(results, tslib_1.__spread(html_info_1.propertyNames(elem.name), ngAttrs.inputs));
        }
        else if (bindParts[ATTR.KW_ON_IDX] !== undefined || bindParts[ATTR.IDENT_EVENT_IDX] !== undefined) {
            // event binding via on- or ()
            results.push.apply(results, tslib_1.__spread(html_info_1.eventNames(elem.name), ngAttrs.outputs));
        }
        else if (bindParts[ATTR.KW_BINDON_IDX] !== undefined ||
            bindParts[ATTR.IDENT_BANANA_BOX_IDX] !== undefined) {
            // banana-in-a-box binding via bindon- or [()]
            results.push.apply(results, tslib_1.__spread(ngAttrs.bananas));
        }
        return results.map(function (name) {
            return {
                name: name,
                kind: ng.CompletionKind.ATTRIBUTE,
                sortText: name,
            };
        });
    }
    function attributeCompletionsForElement(info, elementName) {
        var e_1, _a, e_2, _b;
        var results = [];
        if (info.template instanceof template_1.InlineTemplate) {
            try {
                // Provide HTML attributes completion only for inline templates
                for (var _c = tslib_1.__values(html_info_1.attributeNames(elementName)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var name_1 = _d.value;
                    results.push({
                        name: name_1,
                        kind: ng.CompletionKind.HTML_ATTRIBUTE,
                        sortText: name_1,
                    });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        // Add Angular attributes
        var ngAttrs = angularAttributes(info, elementName);
        try {
            for (var _e = tslib_1.__values(ngAttrs.others), _f = _e.next(); !_f.done; _f = _e.next()) {
                var name_2 = _f.value;
                results.push({
                    name: name_2,
                    kind: ng.CompletionKind.ATTRIBUTE,
                    sortText: name_2,
                });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return results;
    }
    /**
     * Provide completions to the RHS of an attribute, which is of the form
     * LHS="RHS". The template path is computed from the specified `info` whereas
     * the context is determined from the specified `htmlPath`.
     * @param info Object that contains the template AST
     * @param htmlPath Path to the HTML node
     */
    function attributeValueCompletions(info, htmlPath) {
        // Find the corresponding Template AST path.
        var templatePath = utils_1.findTemplateAstAt(info.templateAst, htmlPath.position);
        var visitor = new ExpressionVisitor(info, htmlPath.position, function () {
            var dinfo = utils_1.diagnosticInfoFromTemplateInfo(info);
            return expression_diagnostics_1.getExpressionScope(dinfo, templatePath);
        });
        if (templatePath.tail instanceof compiler_1.AttrAst ||
            templatePath.tail instanceof compiler_1.BoundElementPropertyAst ||
            templatePath.tail instanceof compiler_1.BoundEventAst) {
            templatePath.tail.visit(visitor, null);
            return visitor.results;
        }
        // In order to provide accurate attribute value completion, we need to know
        // what the LHS is, and construct the proper AST if it is missing.
        var htmlAttr = htmlPath.tail;
        var bindParts = htmlAttr.name.match(BIND_NAME_REGEXP);
        if (bindParts && bindParts[ATTR.KW_REF_IDX] !== undefined) {
            var refAst = void 0;
            var elemAst = void 0;
            if (templatePath.tail instanceof compiler_1.ReferenceAst) {
                refAst = templatePath.tail;
                var parent_1 = templatePath.parentOf(refAst);
                if (parent_1 instanceof compiler_1.ElementAst) {
                    elemAst = parent_1;
                }
            }
            else if (templatePath.tail instanceof compiler_1.ElementAst) {
                refAst = new compiler_1.ReferenceAst(htmlAttr.name, null, htmlAttr.value, htmlAttr.valueSpan);
                elemAst = templatePath.tail;
            }
            if (refAst && elemAst) {
                refAst.visit(visitor, elemAst);
            }
        }
        else {
            // HtmlAst contains the `Attribute` node, however the corresponding `AttrAst`
            // node is missing from the TemplateAst.
            var attrAst = new compiler_1.AttrAst(htmlAttr.name, htmlAttr.value, htmlAttr.valueSpan);
            attrAst.visit(visitor, null);
        }
        return visitor.results;
    }
    function elementCompletions(info) {
        var e_3, _a;
        var results = tslib_1.__spread(ANGULAR_ELEMENTS);
        if (info.template instanceof template_1.InlineTemplate) {
            // Provide HTML elements completion only for inline templates
            results.push.apply(results, tslib_1.__spread(HTML_ELEMENTS));
        }
        // Collect the elements referenced by the selectors
        var components = new Set();
        try {
            for (var _b = tslib_1.__values(utils_1.getSelectors(info).selectors), _c = _b.next(); !_c.done; _c = _b.next()) {
                var selector = _c.value;
                var name_3 = selector.element;
                if (name_3 && !components.has(name_3)) {
                    components.add(name_3);
                    results.push({
                        name: name_3,
                        kind: ng.CompletionKind.COMPONENT,
                        sortText: name_3,
                    });
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return results;
    }
    function entityCompletions(value, position) {
        // Look for entity completions
        var re = /&[A-Za-z]*;?(?!\d)/g;
        var found;
        var result = [];
        while (found = re.exec(value)) {
            var len = found[0].length;
            if (position >= found.index && position < (found.index + len)) {
                result = Object.keys(compiler_1.NAMED_ENTITIES).map(function (name) {
                    return {
                        name: "&" + name + ";",
                        kind: ng.CompletionKind.ENTITY,
                        sortText: name,
                    };
                });
                break;
            }
        }
        return result;
    }
    function interpolationCompletions(info, position) {
        // Look for an interpolation in at the position.
        var templatePath = utils_1.findTemplateAstAt(info.templateAst, position);
        if (!templatePath.tail) {
            return [];
        }
        var visitor = new ExpressionVisitor(info, position, function () { return expression_diagnostics_1.getExpressionScope(utils_1.diagnosticInfoFromTemplateInfo(info), templatePath); });
        templatePath.tail.visit(visitor, null);
        return visitor.results;
    }
    // There is a special case of HTML where text that contains a unclosed tag is treated as
    // text. For exaple '<h1> Some <a text </h1>' produces a text nodes inside of the H1
    // element "Some <a text". We, however, want to treat this as if the user was requesting
    // the attributes of an "a" element, not requesting completion in the a text element. This
    // code checks for this case and returns element completions if it is detected or undefined
    // if it is not.
    function voidElementAttributeCompletions(info, path) {
        var tail = path.tail;
        if (tail instanceof compiler_1.Text) {
            var match = tail.value.match(/<(\w(\w|\d|-)*:)?(\w(\w|\d|-)*)\s/);
            // The position must be after the match, otherwise we are still in a place where elements
            // are expected (such as `<|a` or `<a|`; we only want attributes for `<a |` or after).
            if (match &&
                path.position >= (match.index || 0) + match[0].length + tail.sourceSpan.start.offset) {
                return attributeCompletionsForElement(info, match[3]);
            }
        }
        return [];
    }
    var ExpressionVisitor = /** @class */ (function (_super) {
        tslib_1.__extends(ExpressionVisitor, _super);
        function ExpressionVisitor(info, position, getExpressionScope) {
            var _this = _super.call(this) || this;
            _this.info = info;
            _this.position = position;
            _this.getExpressionScope = getExpressionScope;
            _this.completions = new Map();
            return _this;
        }
        Object.defineProperty(ExpressionVisitor.prototype, "results", {
            get: function () { return Array.from(this.completions.values()); },
            enumerable: true,
            configurable: true
        });
        ExpressionVisitor.prototype.visitDirectiveProperty = function (ast) {
            this.processExpressionCompletions(ast.value);
        };
        ExpressionVisitor.prototype.visitElementProperty = function (ast) {
            this.processExpressionCompletions(ast.value);
        };
        ExpressionVisitor.prototype.visitEvent = function (ast) { this.processExpressionCompletions(ast.handler); };
        ExpressionVisitor.prototype.visitElement = function () {
            // no-op for now
        };
        ExpressionVisitor.prototype.visitAttr = function (ast) {
            var _this = this;
            if (ast.name.startsWith(TEMPLATE_ATTR_PREFIX)) {
                // This a template binding given by micro syntax expression.
                // First, verify the attribute consists of some binding we can give completions for.
                // The sourceSpan of AttrAst points to the RHS of the attribute
                var templateKey = ast.name.substring(TEMPLATE_ATTR_PREFIX.length);
                var templateValue = ast.sourceSpan.toString();
                var templateUrl = ast.sourceSpan.start.file.url;
                // TODO(kyliau): We are unable to determine the absolute offset of the key
                // but it is okay here, because we are only looking at the RHS of the attr
                var absKeyOffset = 0;
                var absValueOffset = ast.sourceSpan.start.offset;
                var templateBindings = this.info.expressionParser.parseTemplateBindings(templateKey, templateValue, templateUrl, absKeyOffset, absValueOffset).templateBindings;
                // Find the template binding that contains the position.
                var binding = templateBindings.find(function (b) { return utils_1.inSpan(_this.position, b.sourceSpan); });
                if (!binding) {
                    return;
                }
                this.microSyntaxInAttributeValue(ast, binding);
            }
            else {
                var expressionAst = this.info.expressionParser.parseBinding(ast.value, ast.sourceSpan.toString(), ast.sourceSpan.start.offset);
                this.processExpressionCompletions(expressionAst);
            }
        };
        ExpressionVisitor.prototype.visitReference = function (_ast, context) {
            var _this = this;
            context.directives.forEach(function (dir) {
                var exportAs = dir.directive.exportAs;
                if (exportAs) {
                    _this.completions.set(exportAs, { name: exportAs, kind: ng.CompletionKind.REFERENCE, sortText: exportAs });
                }
            });
        };
        ExpressionVisitor.prototype.visitBoundText = function (ast) {
            if (utils_1.inSpan(this.position, ast.value.sourceSpan)) {
                var completions = expressions_1.getExpressionCompletions(this.getExpressionScope(), ast.value, this.position, this.info.template);
                if (completions) {
                    this.addSymbolsToCompletions(completions);
                }
            }
        };
        ExpressionVisitor.prototype.processExpressionCompletions = function (value) {
            var symbols = expressions_1.getExpressionCompletions(this.getExpressionScope(), value, this.position, this.info.template);
            if (symbols) {
                this.addSymbolsToCompletions(symbols);
            }
        };
        ExpressionVisitor.prototype.addSymbolsToCompletions = function (symbols) {
            var e_4, _a;
            try {
                for (var symbols_1 = tslib_1.__values(symbols), symbols_1_1 = symbols_1.next(); !symbols_1_1.done; symbols_1_1 = symbols_1.next()) {
                    var s = symbols_1_1.value;
                    if (s.name.startsWith('__') || !s.public || this.completions.has(s.name)) {
                        continue;
                    }
                    // The pipe method should not include parentheses.
                    // e.g. {{ value_expression | slice : start [ : end ] }}
                    var shouldInsertParentheses = s.callable && s.kind !== ng.CompletionKind.PIPE;
                    this.completions.set(s.name, {
                        name: s.name,
                        kind: s.kind,
                        sortText: s.name,
                        insertText: shouldInsertParentheses ? s.name + "()" : s.name,
                    });
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (symbols_1_1 && !symbols_1_1.done && (_a = symbols_1.return)) _a.call(symbols_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
        };
        /**
         * This method handles the completions of attribute values for directives that
         * support the microsyntax format. Examples are *ngFor and *ngIf.
         * These directives allows declaration of "let" variables, adds context-specific
         * symbols like $implicit, index, count, among other behaviors.
         * For a complete description of such format, see
         * https://angular.io/guide/structural-directives#the-asterisk--prefix
         *
         * @param attr descriptor for attribute name and value pair
         * @param binding template binding for the expression in the attribute
         */
        ExpressionVisitor.prototype.microSyntaxInAttributeValue = function (attr, binding) {
            var _a;
            var key = attr.name.substring(1); // remove leading asterisk
            // Find the selector - eg ngFor, ngIf, etc
            var selectorInfo = utils_1.getSelectors(this.info);
            var selector = selectorInfo.selectors.find(function (s) {
                // attributes are listed in (attribute, value) pairs
                for (var i = 0; i < s.attrs.length; i += 2) {
                    if (s.attrs[i] === key) {
                        return true;
                    }
                }
            });
            if (!selector) {
                return;
            }
            var valueRelativePosition = this.position - attr.sourceSpan.start.offset;
            if (binding instanceof compiler_1.VariableBinding) {
                // TODO(kyliau): With expression sourceSpan we shouldn't have to search
                // the attribute value string anymore. Just check if position is in the
                // expression source span.
                var equalLocation = attr.value.indexOf('=');
                if (equalLocation > 0 && valueRelativePosition > equalLocation) {
                    // We are after the '=' in a let clause. The valid values here are the members of the
                    // template reference's type parameter.
                    var directiveMetadata = selectorInfo.map.get(selector);
                    if (directiveMetadata) {
                        var contextTable = this.info.template.query.getTemplateContext(directiveMetadata.type.reference);
                        if (contextTable) {
                            // This adds symbols like $implicit, index, count, etc.
                            this.addSymbolsToCompletions(contextTable.values());
                            return;
                        }
                    }
                }
            }
            else if (utils_1.inSpan(valueRelativePosition, (_a = binding.value) === null || _a === void 0 ? void 0 : _a.ast.span)) {
                this.processExpressionCompletions(binding.value.ast);
                return;
            }
            // If the expression is incomplete, for example *ngFor="let x of |"
            // binding.expression is null. We could still try to provide suggestions
            // by looking for symbols that are in scope.
            var KW_OF = ' of ';
            var ofLocation = attr.value.indexOf(KW_OF);
            if (ofLocation > 0 && valueRelativePosition >= ofLocation + KW_OF.length) {
                var expressionAst = this.info.expressionParser.parseBinding(attr.value, attr.sourceSpan.toString(), attr.sourceSpan.start.offset);
                this.processExpressionCompletions(expressionAst);
            }
        };
        return ExpressionVisitor;
    }(compiler_1.NullTemplateVisitor));
    function getSourceText(template, span) {
        return template.source.substring(span.start, span.end);
    }
    /**
     * Return all Angular-specific attributes for the element with `elementName`.
     * @param info
     * @param elementName
     */
    function angularAttributes(info, elementName) {
        var e_5, _a, e_6, _b, e_7, _c, e_8, _d;
        var _e = utils_1.getSelectors(info), selectors = _e.selectors, selectorMap = _e.map;
        var templateRefs = new Set();
        var inputs = new Set();
        var outputs = new Set();
        var bananas = new Set();
        var others = new Set();
        try {
            for (var selectors_1 = tslib_1.__values(selectors), selectors_1_1 = selectors_1.next(); !selectors_1_1.done; selectors_1_1 = selectors_1.next()) {
                var selector = selectors_1_1.value;
                if (selector.element && selector.element !== elementName) {
                    continue;
                }
                var summary = selectorMap.get(selector);
                var hasTemplateRef = utils_1.isStructuralDirective(summary.type);
                // attributes are listed in (attribute, value) pairs
                for (var i = 0; i < selector.attrs.length; i += 2) {
                    var attr = selector.attrs[i];
                    if (hasTemplateRef) {
                        templateRefs.add(attr);
                    }
                    else {
                        others.add(attr);
                    }
                }
                try {
                    for (var _f = (e_6 = void 0, tslib_1.__values(Object.values(summary.inputs))), _g = _f.next(); !_g.done; _g = _f.next()) {
                        var input = _g.value;
                        inputs.add(input);
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
                try {
                    for (var _h = (e_7 = void 0, tslib_1.__values(Object.values(summary.outputs))), _j = _h.next(); !_j.done; _j = _h.next()) {
                        var output = _j.value;
                        outputs.add(output);
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_j && !_j.done && (_c = _h.return)) _c.call(_h);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (selectors_1_1 && !selectors_1_1.done && (_a = selectors_1.return)) _a.call(selectors_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        try {
            for (var inputs_1 = tslib_1.__values(inputs), inputs_1_1 = inputs_1.next(); !inputs_1_1.done; inputs_1_1 = inputs_1.next()) {
                var name_4 = inputs_1_1.value;
                // Add banana-in-a-box syntax
                // https://angular.io/guide/template-syntax#two-way-binding-
                if (outputs.has(name_4 + "Change")) {
                    bananas.add(name_4);
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (inputs_1_1 && !inputs_1_1.done && (_d = inputs_1.return)) _d.call(inputs_1);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return { templateRefs: templateRefs, inputs: inputs, outputs: outputs, bananas: bananas, others: others };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9jb21wbGV0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCw4Q0FBdVY7SUFDdlYscURBQTJFO0lBRzNFLCtGQUE0RDtJQUM1RCx5RUFBdUQ7SUFDdkQscUVBQW9GO0lBQ3BGLG1FQUEwQztJQUMxQyx3REFBOEI7SUFDOUIsNkRBQXdKO0lBRXhKLElBQU0sb0JBQW9CLEdBQ3RCLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDckYsSUFBTSxhQUFhLEdBQ2Ysd0JBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUEvQixDQUErQixDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsSUFBSTtRQUNyRSxPQUFPO1lBQ0wsSUFBSSxNQUFBO1lBQ0osSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsWUFBWTtZQUNwQyxRQUFRLEVBQUUsSUFBSTtTQUNmLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUNQLElBQU0sZ0JBQWdCLEdBQXNDO1FBQzFEO1lBQ0UsSUFBSSxFQUFFLGNBQWM7WUFDcEIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsZUFBZTtZQUN2QyxRQUFRLEVBQUUsY0FBYztTQUN6QjtRQUNEO1lBQ0UsSUFBSSxFQUFFLFlBQVk7WUFDbEIsSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsZUFBZTtZQUN2QyxRQUFRLEVBQUUsWUFBWTtTQUN2QjtRQUNEO1lBQ0Us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biAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVNULCBBU1RXaXRoU291cmNlLCBBc3RQYXRoLCBBdHRyQXN0LCBBdHRyaWJ1dGUsIEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3QsIEJvdW5kRWxlbWVudFByb3BlcnR5QXN0LCBCb3VuZEV2ZW50QXN0LCBCb3VuZFRleHRBc3QsIEVsZW1lbnQsIEVsZW1lbnRBc3QsIEh0bWxBc3RQYXRoLCBOQU1FRF9FTlRJVElFUywgTm9kZSBhcyBIdG1sQXN0LCBOdWxsVGVtcGxhdGVWaXNpdG9yLCBSZWZlcmVuY2VBc3QsIFRhZ0NvbnRlbnRUeXBlLCBUZW1wbGF0ZUJpbmRpbmcsIFRleHQsIFZhcmlhYmxlQmluZGluZywgZ2V0SHRtbFRhZ0RlZmluaXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7JCQsICRfLCBpc0FzY2lpTGV0dGVyLCBpc0RpZ2l0fSBmcm9tICdAYW5ndWxhci9jb21waWxlci9zcmMvY2hhcnMnO1xuXG5pbXBvcnQge0FzdFJlc3VsdH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHtnZXRFeHByZXNzaW9uU2NvcGV9IGZyb20gJy4vZXhwcmVzc2lvbl9kaWFnbm9zdGljcyc7XG5pbXBvcnQge2dldEV4cHJlc3Npb25Db21wbGV0aW9uc30gZnJvbSAnLi9leHByZXNzaW9ucyc7XG5pbXBvcnQge2F0dHJpYnV0ZU5hbWVzLCBlbGVtZW50TmFtZXMsIGV2ZW50TmFtZXMsIHByb3BlcnR5TmFtZXN9IGZyb20gJy4vaHRtbF9pbmZvJztcbmltcG9ydCB7SW5saW5lVGVtcGxhdGV9IGZyb20gJy4vdGVtcGxhdGUnO1xuaW1wb3J0ICogYXMgbmcgZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2RpYWdub3N0aWNJbmZvRnJvbVRlbXBsYXRlSW5mbywgZmluZFRlbXBsYXRlQXN0QXQsIGdldFBhdGhUb05vZGVBdFBvc2l0aW9uLCBnZXRTZWxlY3RvcnMsIGluU3BhbiwgaXNTdHJ1Y3R1cmFsRGlyZWN0aXZlLCBzcGFuT2Z9IGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBISURERU5fSFRNTF9FTEVNRU5UUzogUmVhZG9ubHlTZXQ8c3RyaW5nPiA9XG4gICAgbmV3IFNldChbJ2h0bWwnLCAnc2NyaXB0JywgJ25vc2NyaXB0JywgJ2Jhc2UnLCAnYm9keScsICd0aXRsZScsICdoZWFkJywgJ2xpbmsnXSk7XG5jb25zdCBIVE1MX0VMRU1FTlRTOiBSZWFkb25seUFycmF5PG5nLkNvbXBsZXRpb25FbnRyeT4gPVxuICAgIGVsZW1lbnROYW1lcygpLmZpbHRlcihuYW1lID0+ICFISURERU5fSFRNTF9FTEVNRU5UUy5oYXMobmFtZSkpLm1hcChuYW1lID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGtpbmQ6IG5nLkNvbXBsZXRpb25LaW5kLkhUTUxfRUxFTUVOVCxcbiAgICAgICAgc29ydFRleHQ6IG5hbWUsXG4gICAgICB9O1xuICAgIH0pO1xuY29uc3QgQU5HVUxBUl9FTEVNRU5UUzogUmVhZG9ubHlBcnJheTxuZy5Db21wbGV0aW9uRW50cnk+ID0gW1xuICB7XG4gICAgbmFtZTogJ25nLWNvbnRhaW5lcicsXG4gICAga2luZDogbmcuQ29tcGxldGlvbktpbmQuQU5HVUxBUl9FTEVNRU5ULFxuICAgIHNvcnRUZXh0OiAnbmctY29udGFpbmVyJyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICduZy1jb250ZW50JyxcbiAgICBraW5kOiBuZy5Db21wbGV0aW9uS2luZC5BTkdVTEFSX0VMRU1FTlQsXG4gICAgc29ydFRleHQ6ICduZy1jb250ZW50JyxcbiAgfSxcbiAge1xuICAgIG5hbWU6ICduZy10ZW1wbGF0ZScsXG4gICAga2luZDogbmcuQ29tcGxldGlvbktpbmQuQU5HVUxBUl9FTEVNRU5ULFxuICAgIHNvcnRUZXh0OiAnbmctdGVtcGxhdGUnLFxuICB9LFxuXTtcblxuLy8gVGhpcyBpcyBhZGFwdGVkIGZyb20gcGFja2FnZXMvY29tcGlsZXIvc3JjL3JlbmRlcjMvcjNfdGVtcGxhdGVfdHJhbnNmb3JtLnRzXG4vLyB0byBhbGxvdyBlbXB0eSBiaW5kaW5nIG5hbWVzLlxuY29uc3QgQklORF9OQU1FX1JFR0VYUCA9XG4gICAgL14oPzooPzooPzooYmluZC0pfChsZXQtKXwocmVmLXwjKXwob24tKXwoYmluZG9uLSl8KEApKSguKikpfFxcW1xcKChbXlxcKV0qKVxcKVxcXXxcXFsoW15cXF1dKilcXF18XFwoKFteXFwpXSopXFwpKSQvO1xuZW51bSBBVFRSIHtcbiAgLy8gR3JvdXAgMSA9IFwiYmluZC1cIlxuICBLV19CSU5EX0lEWCA9IDEsXG4gIC8vIEdyb3VwIDIgPSBcImxldC1cIlxuICBLV19MRVRfSURYID0gMixcbiAgLy8gR3JvdXAgMyA9IFwicmVmLS8jXCJcbiAgS1dfUkVGX0lEWCA9IDMsXG4gIC8vIEdyb3VwIDQgPSBcIm9uLVwiXG4gIEtXX09OX0lEWCA9IDQsXG4gIC8vIEdyb3VwIDUgPSBcImJpbmRvbi1cIlxuICBLV19CSU5ET05fSURYID0gNSxcbiAgLy8gR3JvdXAgNiA9IFwiQFwiXG4gIEtXX0FUX0lEWCA9IDYsXG4gIC8vIEdyb3VwIDcgPSB0aGUgaWRlbnRpZmllciBhZnRlciBcImJpbmQtXCIsIFwibGV0LVwiLCBcInJlZi0vI1wiLCBcIm9uLVwiLCBcImJpbmRvbi1cIiBvciBcIkBcIlxuICBJREVOVF9LV19JRFggPSA3LFxuICAvLyBHcm91cCA4ID0gaWRlbnRpZmllciBpbnNpZGUgWygpXVxuICBJREVOVF9CQU5BTkFfQk9YX0lEWCA9IDgsXG4gIC8vIEdyb3VwIDkgPSBpZGVudGlmaWVyIGluc2lkZSBbXVxuICBJREVOVF9QUk9QRVJUWV9JRFggPSA5LFxuICAvLyBHcm91cCAxMCA9IGlkZW50aWZpZXIgaW5zaWRlICgpXG4gIElERU5UX0VWRU5UX0lEWCA9IDEwLFxufVxuLy8gTWljcm9zeW50YXggdGVtcGxhdGUgc3RhcnRzIHdpdGggJyonLiBTZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2FwaS9jb3JlL1RlbXBsYXRlUmVmXG5jb25zdCBURU1QTEFURV9BVFRSX1BSRUZJWCA9ICcqJztcblxuZnVuY3Rpb24gaXNJZGVudGlmaWVyUGFydChjb2RlOiBudW1iZXIpIHtcbiAgLy8gSWRlbnRpZmllcnMgY29uc2lzdCBvZiBhbHBoYW51bWVyaWMgY2hhcmFjdGVycywgJ18nLCBvciAnJCcuXG4gIHJldHVybiBpc0FzY2lpTGV0dGVyKGNvZGUpIHx8IGlzRGlnaXQoY29kZSkgfHwgY29kZSA9PSAkJCB8fCBjb2RlID09ICRfO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIHNwYW4gb2Ygd29yZCBpbiBhIHRlbXBsYXRlIHRoYXQgc3Vycm91bmRzIGBwb3NpdGlvbmAuIElmIHRoZXJlIGlzIG5vIHdvcmQgYXJvdW5kXG4gKiBgcG9zaXRpb25gLCBub3RoaW5nIGlzIHJldHVybmVkLlxuICovXG5mdW5jdGlvbiBnZXRCb3VuZGVkV29yZFNwYW4odGVtcGxhdGVJbmZvOiBBc3RSZXN1bHQsIHBvc2l0aW9uOiBudW1iZXIpOiB0cy5UZXh0U3Bhbnx1bmRlZmluZWQge1xuICBjb25zdCB7dGVtcGxhdGV9ID0gdGVtcGxhdGVJbmZvO1xuICBjb25zdCB0ZW1wbGF0ZVNyYyA9IHRlbXBsYXRlLnNvdXJjZTtcblxuICBpZiAoIXRlbXBsYXRlU3JjKSByZXR1cm47XG5cbiAgLy8gVE9ETyhheWF6aGFmaXopOiBBIHNvbHV0aW9uIGJhc2VkIG9uIHdvcmQgZXhwYW5zaW9uIHdpbGwgYWx3YXlzIGJlIGV4cGVuc2l2ZSBjb21wYXJlZCB0byBvbmVcbiAgLy8gYmFzZWQgb24gQVNUcy4gV2hhdGV2ZXIgcGVuYWx0eSB3ZSBpbmN1ciBpcyBwcm9iYWJseSBtYW5hZ2VhYmxlIGZvciBzbWFsbC1sZW5ndGggKGkuZS4gdGhlXG4gIC8vIG1ham9yaXR5IG9mKSBpZGVudGlmaWVycywgYnV0IHRoZSBjdXJyZW50IHNvbHV0aW9uIGludm9sZXMgYSBudW1iZXIgb2YgYnJhbmNoaW5ncyBhbmQgd2UgY2FuJ3RcbiAgLy8gY29udHJvbCBwb3RlbnRpYWxseSB2ZXJ5IGxvbmcgaWRlbnRpZmllcnMuIENvbnNpZGVyIG1vdmluZyB0byBhbiBBU1QtYmFzZWQgc29sdXRpb24gb25jZVxuICAvLyBleGlzdGluZyBkaWZmaWN1bHRpZXMgd2l0aCBBU1Qgc3BhbnMgYXJlIG1vcmUgY2xlYXJseSByZXNvbHZlZCAoc2VlICMzMTg5OCBmb3IgZGlzY3Vzc2lvbiBvZlxuICAvLyBrbm93biBwcm9ibGVtcywgYW5kICMzMzA5MSBmb3IgaG93IHRoZXkgYWZmZWN0IHRleHQgcmVwbGFjZW1lbnQpLlxuICAvL1xuICAvLyBgdGVtcGxhdGVQb3NpdGlvbmAgcmVwcmVzZW50cyB0aGUgcmlnaHQtYm91bmQgbG9jYXRpb24gb2YgYSBjdXJzb3IgaW4gdGhlIHRlbXBsYXRlLlxuICAvLyAgICBrZXkuZW50fHJ5XG4gIC8vICAgICAgICAgICBeLS0tLSBjdXJzb3IsIGF0IHBvc2l0aW9uIGByYCBpcyBhdC5cbiAgLy8gQSBjdXJzb3IgaXMgbm90IGl0c2VsZiBhIGNoYXJhY3RlciBpbiB0aGUgdGVtcGxhdGU7IGl0IGhhcyBhIGxlZnQgKGxvd2VyKSBhbmQgcmlnaHQgKHVwcGVyKVxuICAvLyBpbmRleCBib3VuZCB0aGF0IGh1Z3MgdGhlIGN1cnNvciBpdHNlbGYuXG4gIGxldCB0ZW1wbGF0ZVBvc2l0aW9uID0gcG9zaXRpb24gLSB0ZW1wbGF0ZS5zcGFuLnN0YXJ0O1xuICAvLyBUbyBwZXJmb3JtIHdvcmQgZXhwYW5zaW9uLCB3ZSB3YW50IHRvIGRldGVybWluZSB0aGUgbGVmdCBhbmQgcmlnaHQgaW5kaWNlcyB0aGF0IGh1ZyB0aGUgY3Vyc29yLlxuICAvLyBUaGVyZSBhcmUgdGhyZWUgY2FzZXMgaGVyZS5cbiAgbGV0IGxlZnQsIHJpZ2h0O1xuICBpZiAodGVtcGxhdGVQb3NpdGlvbiA9PT0gMCkge1xuICAgIC8vIDEuIENhc2UgbGlrZVxuICAgIC8vICAgICAgfHJlc3Qgb2YgdGVtcGxhdGVcbiAgICAvLyAgICB0aGUgY3Vyc29yIGlzIGF0IHRoZSBzdGFydCBvZiB0aGUgdGVtcGxhdGUsIGh1Z2dlZCBvbmx5IGJ5IHRoZSByaWdodCBzaWRlICgwLWluZGV4KS5cbiAgICBsZWZ0ID0gcmlnaHQgPSAwO1xuICB9IGVsc2UgaWYgKHRlbXBsYXRlUG9zaXRpb24gPT09IHRlbXBsYXRlU3JjLmxlbmd0aCkge1xuICAgIC8vIDIuIENhc2UgbGlrZVxuICAgIC8vICAgICAgcmVzdCBvZiB0ZW1wbGF0ZXxcbiAgICAvLyAgICB0aGUgY3Vyc29yIGlzIGF0IHRoZSBlbmQgb2YgdGhlIHRlbXBsYXRlLCBodWdnZWQgb25seSBieSB0aGUgbGVmdCBzaWRlIChsYXN0LWluZGV4KS5cbiAgICBsZWZ0ID0gcmlnaHQgPSB0ZW1wbGF0ZVNyYy5sZW5ndGggLSAxO1xuICB9IGVsc2Uge1xuICAgIC8vIDMuIENhc2UgbGlrZVxuICAgIC8vICAgICAgd298cmRcbiAgICAvLyAgICB0aGVyZSBpcyBhIGNsZWFyIGxlZnQgYW5kIHJpZ2h0IGluZGV4LlxuICAgIGxlZnQgPSB0ZW1wbGF0ZVBvc2l0aW9uIC0gMTtcbiAgICByaWdodCA9IHRlbXBsYXRlUG9zaXRpb247XG4gIH1cblxuICBpZiAoIWlzSWRlbnRpZmllclBhcnQodGVtcGxhdGVTcmMuY2hhckNvZGVBdChsZWZ0KSkgJiZcbiAgICAgICFpc0lkZW50aWZpZXJQYXJ0KHRlbXBsYXRlU3JjLmNoYXJDb2RlQXQocmlnaHQpKSkge1xuICAgIC8vIENhc2UgbGlrZVxuICAgIC8vICAgICAgICAgLnwuXG4gICAgLy8gbGVmdCAtLS1eIF4tLS0gcmlnaHRcbiAgICAvLyBUaGVyZSBpcyBubyB3b3JkIGhlcmUuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRXhwYW5kIG9uIHRoZSBsZWZ0IGFuZCByaWdodCBzaWRlIHVudGlsIGEgd29yZCBib3VuZGFyeSBpcyBoaXQuIEJhY2sgdXAgb25lIGV4cGFuc2lvbiBvbiBib3RoXG4gIC8vIHNpZGUgdG8gc3RheSBpbnNpZGUgdGhlIHdvcmQuXG4gIHdoaWxlIChsZWZ0ID49IDAgJiYgaXNJZGVudGlmaWVyUGFydCh0ZW1wbGF0ZVNyYy5jaGFyQ29kZUF0KGxlZnQpKSkgLS1sZWZ0O1xuICArK2xlZnQ7XG4gIHdoaWxlIChyaWdodCA8IHRlbXBsYXRlU3JjLmxlbmd0aCAmJiBpc0lkZW50aWZpZXJQYXJ0KHRlbXBsYXRlU3JjLmNoYXJDb2RlQXQocmlnaHQpKSkgKytyaWdodDtcbiAgLS1yaWdodDtcblxuICBjb25zdCBhYnNvbHV0ZVN0YXJ0UG9zaXRpb24gPSBwb3NpdGlvbiAtICh0ZW1wbGF0ZVBvc2l0aW9uIC0gbGVmdCk7XG4gIGNvbnN0IGxlbmd0aCA9IHJpZ2h0IC0gbGVmdCArIDE7XG4gIHJldHVybiB7c3RhcnQ6IGFic29sdXRlU3RhcnRQb3NpdGlvbiwgbGVuZ3RofTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRlbXBsYXRlQ29tcGxldGlvbnMoXG4gICAgdGVtcGxhdGVJbmZvOiBBc3RSZXN1bHQsIHBvc2l0aW9uOiBudW1iZXIpOiBuZy5Db21wbGV0aW9uRW50cnlbXSB7XG4gIGxldCByZXN1bHQ6IG5nLkNvbXBsZXRpb25FbnRyeVtdID0gW107XG4gIGNvbnN0IHtodG1sQXN0LCB0ZW1wbGF0ZX0gPSB0ZW1wbGF0ZUluZm87XG4gIC8vIFRoZSB0ZW1wbGF0ZU5vZGUgc3RhcnRzIGF0IHRoZSBkZWxpbWl0ZXIgY2hhcmFjdGVyIHNvIHdlIGFkZCAxIHRvIHNraXAgaXQuXG4gIGNvbnN0IHRlbXBsYXRlUG9zaXRpb24gPSBwb3NpdGlvbiAtIHRlbXBsYXRlLnNwYW4uc3RhcnQ7XG4gIGNvbnN0IHBhdGggPSBnZXRQYXRoVG9Ob2RlQXRQb3NpdGlvbihodG1sQXN0LCB0ZW1wbGF0ZVBvc2l0aW9uKTtcbiAgY29uc3QgbW9zdFNwZWNpZmljID0gcGF0aC50YWlsO1xuICBpZiAocGF0aC5lbXB0eSB8fCAhbW9zdFNwZWNpZmljKSB7XG4gICAgcmVzdWx0ID0gZWxlbWVudENvbXBsZXRpb25zKHRlbXBsYXRlSW5mbyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgYXN0UG9zaXRpb24gPSB0ZW1wbGF0ZVBvc2l0aW9uIC0gbW9zdFNwZWNpZmljLnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0O1xuICAgIG1vc3RTcGVjaWZpYy52aXNpdChcbiAgICAgICAge1xuICAgICAgICAgIHZpc2l0RWxlbWVudChhc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0VGFnU3BhbiA9IHNwYW5PZihhc3Quc291cmNlU3Bhbik7XG4gICAgICAgICAgICBjb25zdCB0YWdMZW4gPSBhc3QubmFtZS5sZW5ndGg7XG4gICAgICAgICAgICAvLyArIDEgZm9yIHRoZSBvcGVuaW5nIGFuZ2xlIGJyYWNrZXRcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZVBvc2l0aW9uIDw9IHN0YXJ0VGFnU3Bhbi5zdGFydCArIHRhZ0xlbiArIDEpIHtcbiAgICAgICAgICAgICAgLy8gSWYgd2UgYXJlIGluIHRoZSB0YWcgdGhlbiByZXR1cm4gdGhlIGVsZW1lbnQgY29tcGxldGlvbnMuXG4gICAgICAgICAgICAgIHJlc3VsdCA9IGVsZW1lbnRDb21wbGV0aW9ucyh0ZW1wbGF0ZUluZm8pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0ZW1wbGF0ZVBvc2l0aW9uIDwgc3RhcnRUYWdTcGFuLmVuZCkge1xuICAgICAgICAgICAgICAvLyBXZSBhcmUgaW4gdGhlIGF0dHJpYnV0ZSBzZWN0aW9uIG9mIHRoZSBlbGVtZW50IChidXQgbm90IGluIGFuIGF0dHJpYnV0ZSkuXG4gICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgYXR0cmlidXRlIGNvbXBsZXRpb25zLlxuICAgICAgICAgICAgICByZXN1bHQgPSBhdHRyaWJ1dGVDb21wbGV0aW9uc0ZvckVsZW1lbnQodGVtcGxhdGVJbmZvLCBhc3QubmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB2aXNpdEF0dHJpYnV0ZShhc3Q6IEF0dHJpYnV0ZSkge1xuICAgICAgICAgICAgLy8gQW4gYXR0cmlidXRlIGNvbnNpc3RzIG9mIHR3byBwYXJ0cywgTEhTPVwiUkhTXCIuXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgaWYgY29tcGxldGlvbnMgYXJlIHJlcXVlc3RlZCBmb3IgTEhTIG9yIFJIU1xuICAgICAgICAgICAgaWYgKGFzdC52YWx1ZVNwYW4gJiYgaW5TcGFuKHRlbXBsYXRlUG9zaXRpb24sIHNwYW5PZihhc3QudmFsdWVTcGFuKSkpIHtcbiAgICAgICAgICAgICAgLy8gUkhTIGNvbXBsZXRpb25cbiAgICAgICAgICAgICAgcmVzdWx0ID0gYXR0cmlidXRlVmFsdWVDb21wbGV0aW9ucyh0ZW1wbGF0ZUluZm8sIHBhdGgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gTEhTIGNvbXBsZXRpb25cbiAgICAgICAgICAgICAgcmVzdWx0ID0gYXR0cmlidXRlQ29tcGxldGlvbnModGVtcGxhdGVJbmZvLCBwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHZpc2l0VGV4dChhc3QpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHdlIGFyZSBpbiBhIGVudGl0eS5cbiAgICAgICAgICAgIHJlc3VsdCA9IGVudGl0eUNvbXBsZXRpb25zKGdldFNvdXJjZVRleHQodGVtcGxhdGUsIHNwYW5PZihhc3QpKSwgYXN0UG9zaXRpb24pO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5sZW5ndGgpIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICByZXN1bHQgPSBpbnRlcnBvbGF0aW9uQ29tcGxldGlvbnModGVtcGxhdGVJbmZvLCB0ZW1wbGF0ZVBvc2l0aW9uKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQubGVuZ3RoKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IHBhdGguZmlyc3QoRWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICBjb25zdCBkZWZpbml0aW9uID0gZ2V0SHRtbFRhZ0RlZmluaXRpb24oZWxlbWVudC5uYW1lKTtcbiAgICAgICAgICAgICAgaWYgKGRlZmluaXRpb24uY29udGVudFR5cGUgPT09IFRhZ0NvbnRlbnRUeXBlLlBBUlNBQkxFX0RBVEEpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB2b2lkRWxlbWVudEF0dHJpYnV0ZUNvbXBsZXRpb25zKHRlbXBsYXRlSW5mbywgcGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgZWxlbWVudCBjYW4gaG9sZCBjb250ZW50LCBzaG93IGVsZW1lbnQgY29tcGxldGlvbnMuXG4gICAgICAgICAgICAgICAgICByZXN1bHQgPSBlbGVtZW50Q29tcGxldGlvbnModGVtcGxhdGVJbmZvKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIElmIG5vIGVsZW1lbnQgY29udGFpbmVyLCBpbXBsaWVzIHBhcnNhYmxlIGRhdGEgc28gc2hvdyBlbGVtZW50cy5cbiAgICAgICAgICAgICAgcmVzdWx0ID0gdm9pZEVsZW1lbnRBdHRyaWJ1dGVDb21wbGV0aW9ucyh0ZW1wbGF0ZUluZm8sIHBhdGgpO1xuICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBlbGVtZW50Q29tcGxldGlvbnModGVtcGxhdGVJbmZvKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdmlzaXRDb21tZW50KCkge30sXG4gICAgICAgICAgdmlzaXRFeHBhbnNpb24oKSB7fSxcbiAgICAgICAgICB2aXNpdEV4cGFuc2lvbkNhc2UoKSB7fVxuICAgICAgICB9LFxuICAgICAgICBudWxsKTtcbiAgfVxuXG4gIGNvbnN0IHJlcGxhY2VtZW50U3BhbiA9IGdldEJvdW5kZWRXb3JkU3Bhbih0ZW1wbGF0ZUluZm8sIHBvc2l0aW9uKTtcbiAgcmV0dXJuIHJlc3VsdC5tYXAoZW50cnkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIC4uLmVudHJ5LCByZXBsYWNlbWVudFNwYW4sXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGF0dHJpYnV0ZUNvbXBsZXRpb25zKGluZm86IEFzdFJlc3VsdCwgcGF0aDogQXN0UGF0aDxIdG1sQXN0Pik6IG5nLkNvbXBsZXRpb25FbnRyeVtdIHtcbiAgY29uc3QgYXR0ciA9IHBhdGgudGFpbDtcbiAgY29uc3QgZWxlbSA9IHBhdGgucGFyZW50T2YoYXR0cik7XG4gIGlmICghKGF0dHIgaW5zdGFuY2VvZiBBdHRyaWJ1dGUpIHx8ICEoZWxlbSBpbnN0YW5jZW9mIEVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gVE9ETzogQ29uc2lkZXIgcGFyc2luZyB0aGUgYXR0cmludXRlIG5hbWUgdG8gYSBwcm9wZXIgQVNUIGluc3RlYWQgb2ZcbiAgLy8gbWF0Y2hpbmcgdXNpbmcgcmVnZXguIFRoaXMgaXMgYmVjYXVzZSB0aGUgcmVnZXhwIHdvdWxkIGluY29ycmVjdGx5IGlkZW50aWZ5XG4gIC8vIGJpbmQgcGFydHMgZm9yIGNhc2VzIGxpa2UgWygpfF1cbiAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBeIGN1cnNvciBpcyBoZXJlXG4gIGNvbnN0IGJpbmRQYXJ0cyA9IGF0dHIubmFtZS5tYXRjaChCSU5EX05BTUVfUkVHRVhQKTtcbiAgY29uc3QgaXNUZW1wbGF0ZVJlZiA9IGF0dHIubmFtZS5zdGFydHNXaXRoKFRFTVBMQVRFX0FUVFJfUFJFRklYKTtcbiAgY29uc3QgaXNCaW5kaW5nID0gYmluZFBhcnRzICE9PSBudWxsIHx8IGlzVGVtcGxhdGVSZWY7XG5cbiAgaWYgKCFpc0JpbmRpbmcpIHtcbiAgICByZXR1cm4gYXR0cmlidXRlQ29tcGxldGlvbnNGb3JFbGVtZW50KGluZm8sIGVsZW0ubmFtZSk7XG4gIH1cblxuICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBuZ0F0dHJzID0gYW5ndWxhckF0dHJpYnV0ZXMoaW5mbywgZWxlbS5uYW1lKTtcbiAgaWYgKCFiaW5kUGFydHMpIHtcbiAgICAvLyBJZiBiaW5kUGFydHMgaXMgbnVsbCB0aGVuIHRoaXMgbXVzdCBiZSBhIFRlbXBsYXRlUmVmLlxuICAgIHJlc3VsdHMucHVzaCguLi5uZ0F0dHJzLnRlbXBsYXRlUmVmcyk7XG4gIH0gZWxzZSBpZiAoXG4gICAgICBiaW5kUGFydHNbQVRUUi5LV19CSU5EX0lEWF0gIT09IHVuZGVmaW5lZCB8fFxuICAgICAgYmluZFBhcnRzW0FUVFIuSURFTlRfUFJPUEVSVFlfSURYXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gcHJvcGVydHkgYmluZGluZyB2aWEgYmluZC0gb3IgW11cbiAgICByZXN1bHRzLnB1c2goLi4ucHJvcGVydHlOYW1lcyhlbGVtLm5hbWUpLCAuLi5uZ0F0dHJzLmlucHV0cyk7XG4gIH0gZWxzZSBpZiAoXG4gICAgICBiaW5kUGFydHNbQVRUUi5LV19PTl9JRFhdICE9PSB1bmRlZmluZWQgfHwgYmluZFBhcnRzW0FUVFIuSURFTlRfRVZFTlRfSURYXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gZXZlbnQgYmluZGluZyB2aWEgb24tIG9yICgpXG4gICAgcmVzdWx0cy5wdXNoKC4uLmV2ZW50TmFtZXMoZWxlbS5uYW1lKSwgLi4ubmdBdHRycy5vdXRwdXRzKTtcbiAgfSBlbHNlIGlmIChcbiAgICAgIGJpbmRQYXJ0c1tBVFRSLktXX0JJTkRPTl9JRFhdICE9PSB1bmRlZmluZWQgfHxcbiAgICAgIGJpbmRQYXJ0c1tBVFRSLklERU5UX0JBTkFOQV9CT1hfSURYXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gYmFuYW5hLWluLWEtYm94IGJpbmRpbmcgdmlhIGJpbmRvbi0gb3IgWygpXVxuICAgIHJlc3VsdHMucHVzaCguLi5uZ0F0dHJzLmJhbmFuYXMpO1xuICB9XG4gIHJldHVybiByZXN1bHRzLm1hcChuYW1lID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZSxcbiAgICAgIGtpbmQ6IG5nLkNvbXBsZXRpb25LaW5kLkFUVFJJQlVURSxcbiAgICAgIHNvcnRUZXh0OiBuYW1lLFxuICAgIH07XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhdHRyaWJ1dGVDb21wbGV0aW9uc0ZvckVsZW1lbnQoXG4gICAgaW5mbzogQXN0UmVzdWx0LCBlbGVtZW50TmFtZTogc3RyaW5nKTogbmcuQ29tcGxldGlvbkVudHJ5W10ge1xuICBjb25zdCByZXN1bHRzOiBuZy5Db21wbGV0aW9uRW50cnlbXSA9IFtdO1xuXG4gIGlmIChpbmZvLnRlbXBsYXRlIGluc3RhbmNlb2YgSW5saW5lVGVtcGxhdGUpIHtcbiAgICAvLyBQcm92aWRlIEhUTUwgYXR0cmlidXRlcyBjb21wbGV0aW9uIG9ubHkgZm9yIGlubGluZSB0ZW1wbGF0ZXNcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgYXR0cmlidXRlTmFtZXMoZWxlbWVudE5hbWUpKSB7XG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICBuYW1lLFxuICAgICAgICBraW5kOiBuZy5Db21wbGV0aW9uS2luZC5IVE1MX0FUVFJJQlVURSxcbiAgICAgICAgc29ydFRleHQ6IG5hbWUsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgQW5ndWxhciBhdHRyaWJ1dGVzXG4gIGNvbnN0IG5nQXR0cnMgPSBhbmd1bGFyQXR0cmlidXRlcyhpbmZvLCBlbGVtZW50TmFtZSk7XG4gIGZvciAoY29uc3QgbmFtZSBvZiBuZ0F0dHJzLm90aGVycykge1xuICAgIHJlc3VsdHMucHVzaCh7XG4gICAgICBuYW1lLFxuICAgICAga2luZDogbmcuQ29tcGxldGlvbktpbmQuQVRUUklCVVRFLFxuICAgICAgc29ydFRleHQ6IG5hbWUsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBQcm92aWRlIGNvbXBsZXRpb25zIHRvIHRoZSBSSFMgb2YgYW4gYXR0cmlidXRlLCB3aGljaCBpcyBvZiB0aGUgZm9ybVxuICogTEhTPVwiUkhTXCIuIFRoZSB0ZW1wbGF0ZSBwYXRoIGlzIGNvbXB1dGVkIGZyb20gdGhlIHNwZWNpZmllZCBgaW5mb2Agd2hlcmVhc1xuICogdGhlIGNvbnRleHQgaXMgZGV0ZXJtaW5lZCBmcm9tIHRoZSBzcGVjaWZpZWQgYGh0bWxQYXRoYC5cbiAqIEBwYXJhbSBpbmZvIE9iamVjdCB0aGF0IGNvbnRhaW5zIHRoZSB0ZW1wbGF0ZSBBU1RcbiAqIEBwYXJhbSBodG1sUGF0aCBQYXRoIHRvIHRoZSBIVE1MIG5vZGVcbiAqL1xuZnVuY3Rpb24gYXR0cmlidXRlVmFsdWVDb21wbGV0aW9ucyhpbmZvOiBBc3RSZXN1bHQsIGh0bWxQYXRoOiBIdG1sQXN0UGF0aCk6IG5nLkNvbXBsZXRpb25FbnRyeVtdIHtcbiAgLy8gRmluZCB0aGUgY29ycmVzcG9uZGluZyBUZW1wbGF0ZSBBU1QgcGF0aC5cbiAgY29uc3QgdGVtcGxhdGVQYXRoID0gZmluZFRlbXBsYXRlQXN0QXQoaW5mby50ZW1wbGF0ZUFzdCwgaHRtbFBhdGgucG9zaXRpb24pO1xuICBjb25zdCB2aXNpdG9yID0gbmV3IEV4cHJlc3Npb25WaXNpdG9yKGluZm8sIGh0bWxQYXRoLnBvc2l0aW9uLCAoKSA9PiB7XG4gICAgY29uc3QgZGluZm8gPSBkaWFnbm9zdGljSW5mb0Zyb21UZW1wbGF0ZUluZm8oaW5mbyk7XG4gICAgcmV0dXJuIGdldEV4cHJlc3Npb25TY29wZShkaW5mbywgdGVtcGxhdGVQYXRoKTtcbiAgfSk7XG4gIGlmICh0ZW1wbGF0ZVBhdGgudGFpbCBpbnN0YW5jZW9mIEF0dHJBc3QgfHxcbiAgICAgIHRlbXBsYXRlUGF0aC50YWlsIGluc3RhbmNlb2YgQm91bmRFbGVtZW50UHJvcGVydHlBc3QgfHxcbiAgICAgIHRlbXBsYXRlUGF0aC50YWlsIGluc3RhbmNlb2YgQm91bmRFdmVudEFzdCkge1xuICAgIHRlbXBsYXRlUGF0aC50YWlsLnZpc2l0KHZpc2l0b3IsIG51bGwpO1xuICAgIHJldHVybiB2aXNpdG9yLnJlc3VsdHM7XG4gIH1cbiAgLy8gSW4gb3JkZXIgdG8gcHJvdmlkZSBhY2N1cmF0ZSBhdHRyaWJ1dGUgdmFsdWUgY29tcGxldGlvbiwgd2UgbmVlZCB0byBrbm93XG4gIC8vIHdoYXQgdGhlIExIUyBpcywgYW5kIGNvbnN0cnVjdCB0aGUgcHJvcGVyIEFTVCBpZiBpdCBpcyBtaXNzaW5nLlxuICBjb25zdCBodG1sQXR0ciA9IGh0bWxQYXRoLnRhaWwgYXMgQXR0cmlidXRlO1xuICBjb25zdCBiaW5kUGFydHMgPSBodG1sQXR0ci5uYW1lLm1hdGNoKEJJTkRfTkFNRV9SRUdFWFApO1xuICBpZiAoYmluZFBhcnRzICYmIGJpbmRQYXJ0c1tBVFRSLktXX1JFRl9JRFhdICE9PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgcmVmQXN0OiBSZWZlcmVuY2VBc3R8dW5kZWZpbmVkO1xuICAgIGxldCBlbGVtQXN0OiBFbGVtZW50QXN0fHVuZGVmaW5lZDtcbiAgICBpZiAodGVtcGxhdGVQYXRoLnRhaWwgaW5zdGFuY2VvZiBSZWZlcmVuY2VBc3QpIHtcbiAgICAgIHJlZkFzdCA9IHRlbXBsYXRlUGF0aC50YWlsO1xuICAgICAgY29uc3QgcGFyZW50ID0gdGVtcGxhdGVQYXRoLnBhcmVudE9mKHJlZkFzdCk7XG4gICAgICBpZiAocGFyZW50IGluc3RhbmNlb2YgRWxlbWVudEFzdCkge1xuICAgICAgICBlbGVtQXN0ID0gcGFyZW50O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGVtcGxhdGVQYXRoLnRhaWwgaW5zdGFuY2VvZiBFbGVtZW50QXN0KSB7XG4gICAgICByZWZBc3QgPSBuZXcgUmVmZXJlbmNlQXN0KGh0bWxBdHRyLm5hbWUsIG51bGwgISwgaHRtbEF0dHIudmFsdWUsIGh0bWxBdHRyLnZhbHVlU3BhbiAhKTtcbiAgICAgIGVsZW1Bc3QgPSB0ZW1wbGF0ZVBhdGgudGFpbDtcbiAgICB9XG4gICAgaWYgKHJlZkFzdCAmJiBlbGVtQXN0KSB7XG4gICAgICByZWZBc3QudmlzaXQodmlzaXRvciwgZWxlbUFzdCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIEh0bWxBc3QgY29udGFpbnMgdGhlIGBBdHRyaWJ1dGVgIG5vZGUsIGhvd2V2ZXIgdGhlIGNvcnJlc3BvbmRpbmcgYEF0dHJBc3RgXG4gICAgLy8gbm9kZSBpcyBtaXNzaW5nIGZyb20gdGhlIFRlbXBsYXRlQXN0LlxuICAgIGNvbnN0IGF0dHJBc3QgPSBuZXcgQXR0ckFzdChodG1sQXR0ci5uYW1lLCBodG1sQXR0ci52YWx1ZSwgaHRtbEF0dHIudmFsdWVTcGFuICEpO1xuICAgIGF0dHJBc3QudmlzaXQodmlzaXRvciwgbnVsbCk7XG4gIH1cbiAgcmV0dXJuIHZpc2l0b3IucmVzdWx0cztcbn1cblxuZnVuY3Rpb24gZWxlbWVudENvbXBsZXRpb25zKGluZm86IEFzdFJlc3VsdCk6IG5nLkNvbXBsZXRpb25FbnRyeVtdIHtcbiAgY29uc3QgcmVzdWx0czogbmcuQ29tcGxldGlvbkVudHJ5W10gPSBbLi4uQU5HVUxBUl9FTEVNRU5UU107XG5cbiAgaWYgKGluZm8udGVtcGxhdGUgaW5zdGFuY2VvZiBJbmxpbmVUZW1wbGF0ZSkge1xuICAgIC8vIFByb3ZpZGUgSFRNTCBlbGVtZW50cyBjb21wbGV0aW9uIG9ubHkgZm9yIGlubGluZSB0ZW1wbGF0ZXNcbiAgICByZXN1bHRzLnB1c2goLi4uSFRNTF9FTEVNRU5UUyk7XG4gIH1cblxuICAvLyBDb2xsZWN0IHRoZSBlbGVtZW50cyByZWZlcmVuY2VkIGJ5IHRoZSBzZWxlY3RvcnNcbiAgY29uc3QgY29tcG9uZW50cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIGdldFNlbGVjdG9ycyhpbmZvKS5zZWxlY3RvcnMpIHtcbiAgICBjb25zdCBuYW1lID0gc2VsZWN0b3IuZWxlbWVudDtcbiAgICBpZiAobmFtZSAmJiAhY29tcG9uZW50cy5oYXMobmFtZSkpIHtcbiAgICAgIGNvbXBvbmVudHMuYWRkKG5hbWUpO1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAga2luZDogbmcuQ29tcGxldGlvbktpbmQuQ09NUE9ORU5ULFxuICAgICAgICBzb3J0VGV4dDogbmFtZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5mdW5jdGlvbiBlbnRpdHlDb21wbGV0aW9ucyh2YWx1ZTogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyKTogbmcuQ29tcGxldGlvbkVudHJ5W10ge1xuICAvLyBMb29rIGZvciBlbnRpdHkgY29tcGxldGlvbnNcbiAgY29uc3QgcmUgPSAvJltBLVphLXpdKjs/KD8hXFxkKS9nO1xuICBsZXQgZm91bmQ6IFJlZ0V4cEV4ZWNBcnJheXxudWxsO1xuICBsZXQgcmVzdWx0OiBuZy5Db21wbGV0aW9uRW50cnlbXSA9IFtdO1xuICB3aGlsZSAoZm91bmQgPSByZS5leGVjKHZhbHVlKSkge1xuICAgIGxldCBsZW4gPSBmb3VuZFswXS5sZW5ndGg7XG4gICAgaWYgKHBvc2l0aW9uID49IGZvdW5kLmluZGV4ICYmIHBvc2l0aW9uIDwgKGZvdW5kLmluZGV4ICsgbGVuKSkge1xuICAgICAgcmVzdWx0ID0gT2JqZWN0LmtleXMoTkFNRURfRU5USVRJRVMpLm1hcChuYW1lID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuYW1lOiBgJiR7bmFtZX07YCxcbiAgICAgICAgICBraW5kOiBuZy5Db21wbGV0aW9uS2luZC5FTlRJVFksXG4gICAgICAgICAgc29ydFRleHQ6IG5hbWUsXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpbnRlcnBvbGF0aW9uQ29tcGxldGlvbnMoaW5mbzogQXN0UmVzdWx0LCBwb3NpdGlvbjogbnVtYmVyKTogbmcuQ29tcGxldGlvbkVudHJ5W10ge1xuICAvLyBMb29rIGZvciBhbiBpbnRlcnBvbGF0aW9uIGluIGF0IHRoZSBwb3NpdGlvbi5cbiAgY29uc3QgdGVtcGxhdGVQYXRoID0gZmluZFRlbXBsYXRlQXN0QXQoaW5mby50ZW1wbGF0ZUFzdCwgcG9zaXRpb24pO1xuICBpZiAoIXRlbXBsYXRlUGF0aC50YWlsKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIGNvbnN0IHZpc2l0b3IgPSBuZXcgRXhwcmVzc2lvblZpc2l0b3IoXG4gICAgICBpbmZvLCBwb3NpdGlvbiwgKCkgPT4gZ2V0RXhwcmVzc2lvblNjb3BlKGRpYWdub3N0aWNJbmZvRnJvbVRlbXBsYXRlSW5mbyhpbmZvKSwgdGVtcGxhdGVQYXRoKSk7XG4gIHRlbXBsYXRlUGF0aC50YWlsLnZpc2l0KHZpc2l0b3IsIG51bGwpO1xuICByZXR1cm4gdmlzaXRvci5yZXN1bHRzO1xufVxuXG4vLyBUaGVyZSBpcyBhIHNwZWNpYWwgY2FzZSBvZiBIVE1MIHdoZXJlIHRleHQgdGhhdCBjb250YWlucyBhIHVuY2xvc2VkIHRhZyBpcyB0cmVhdGVkIGFzXG4vLyB0ZXh0LiBGb3IgZXhhcGxlICc8aDE+IFNvbWUgPGEgdGV4dCA8L2gxPicgcHJvZHVjZXMgYSB0ZXh0IG5vZGVzIGluc2lkZSBvZiB0aGUgSDFcbi8vIGVsZW1lbnQgXCJTb21lIDxhIHRleHRcIi4gV2UsIGhvd2V2ZXIsIHdhbnQgdG8gdHJlYXQgdGhpcyBhcyBpZiB0aGUgdXNlciB3YXMgcmVxdWVzdGluZ1xuLy8gdGhlIGF0dHJpYnV0ZXMgb2YgYW4gXCJhXCIgZWxlbWVudCwgbm90IHJlcXVlc3RpbmcgY29tcGxldGlvbiBpbiB0aGUgYSB0ZXh0IGVsZW1lbnQuIFRoaXNcbi8vIGNvZGUgY2hlY2tzIGZvciB0aGlzIGNhc2UgYW5kIHJldHVybnMgZWxlbWVudCBjb21wbGV0aW9ucyBpZiBpdCBpcyBkZXRlY3RlZCBvciB1bmRlZmluZWRcbi8vIGlmIGl0IGlzIG5vdC5cbmZ1bmN0aW9uIHZvaWRFbGVtZW50QXR0cmlidXRlQ29tcGxldGlvbnMoXG4gICAgaW5mbzogQXN0UmVzdWx0LCBwYXRoOiBBc3RQYXRoPEh0bWxBc3Q+KTogbmcuQ29tcGxldGlvbkVudHJ5W10ge1xuICBjb25zdCB0YWlsID0gcGF0aC50YWlsO1xuICBpZiAodGFpbCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICBjb25zdCBtYXRjaCA9IHRhaWwudmFsdWUubWF0Y2goLzwoXFx3KFxcd3xcXGR8LSkqOik/KFxcdyhcXHd8XFxkfC0pKilcXHMvKTtcbiAgICAvLyBUaGUgcG9zaXRpb24gbXVzdCBiZSBhZnRlciB0aGUgbWF0Y2gsIG90aGVyd2lzZSB3ZSBhcmUgc3RpbGwgaW4gYSBwbGFjZSB3aGVyZSBlbGVtZW50c1xuICAgIC8vIGFyZSBleHBlY3RlZCAoc3VjaCBhcyBgPHxhYCBvciBgPGF8YDsgd2Ugb25seSB3YW50IGF0dHJpYnV0ZXMgZm9yIGA8YSB8YCBvciBhZnRlcikuXG4gICAgaWYgKG1hdGNoICYmXG4gICAgICAgIHBhdGgucG9zaXRpb24gPj0gKG1hdGNoLmluZGV4IHx8IDApICsgbWF0Y2hbMF0ubGVuZ3RoICsgdGFpbC5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCkge1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZUNvbXBsZXRpb25zRm9yRWxlbWVudChpbmZvLCBtYXRjaFszXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBbXTtcbn1cblxuY2xhc3MgRXhwcmVzc2lvblZpc2l0b3IgZXh0ZW5kcyBOdWxsVGVtcGxhdGVWaXNpdG9yIHtcbiAgcHJpdmF0ZSByZWFkb25seSBjb21wbGV0aW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBuZy5Db21wbGV0aW9uRW50cnk+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IGluZm86IEFzdFJlc3VsdCwgcHJpdmF0ZSByZWFkb25seSBwb3NpdGlvbjogbnVtYmVyLFxuICAgICAgcHJpdmF0ZSByZWFkb25seSBnZXRFeHByZXNzaW9uU2NvcGU6ICgpID0+IG5nLlN5bWJvbFRhYmxlKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGdldCByZXN1bHRzKCk6IG5nLkNvbXBsZXRpb25FbnRyeVtdIHsgcmV0dXJuIEFycmF5LmZyb20odGhpcy5jb21wbGV0aW9ucy52YWx1ZXMoKSk7IH1cblxuICB2aXNpdERpcmVjdGl2ZVByb3BlcnR5KGFzdDogQm91bmREaXJlY3RpdmVQcm9wZXJ0eUFzdCk6IHZvaWQge1xuICAgIHRoaXMucHJvY2Vzc0V4cHJlc3Npb25Db21wbGV0aW9ucyhhc3QudmFsdWUpO1xuICB9XG5cbiAgdmlzaXRFbGVtZW50UHJvcGVydHkoYXN0OiBCb3VuZEVsZW1lbnRQcm9wZXJ0eUFzdCk6IHZvaWQge1xuICAgIHRoaXMucHJvY2Vzc0V4cHJlc3Npb25Db21wbGV0aW9ucyhhc3QudmFsdWUpO1xuICB9XG5cbiAgdmlzaXRFdmVudChhc3Q6IEJvdW5kRXZlbnRBc3QpOiB2b2lkIHsgdGhpcy5wcm9jZXNzRXhwcmVzc2lvbkNvbXBsZXRpb25zKGFzdC5oYW5kbGVyKTsgfVxuXG4gIHZpc2l0RWxlbWVudCgpOiB2b2lkIHtcbiAgICAvLyBuby1vcCBmb3Igbm93XG4gIH1cblxuICB2aXNpdEF0dHIoYXN0OiBBdHRyQXN0KSB7XG4gICAgaWYgKGFzdC5uYW1lLnN0YXJ0c1dpdGgoVEVNUExBVEVfQVRUUl9QUkVGSVgpKSB7XG4gICAgICAvLyBUaGlzIGEgdGVtcGxhdGUgYmluZGluZyBnaXZlbiBieSBtaWNybyBzeW50YXggZXhwcmVzc2lvbi5cbiAgICAgIC8vIEZpcnN0LCB2ZXJpZnkgdGhlIGF0dHJpYnV0ZSBjb25zaXN0cyBvZiBzb21lIGJpbmRpbmcgd2UgY2FuIGdpdmUgY29tcGxldGlvbnMgZm9yLlxuICAgICAgLy8gVGhlIHNvdXJjZVNwYW4gb2YgQXR0ckFzdCBwb2ludHMgdG8gdGhlIFJIUyBvZiB0aGUgYXR0cmlidXRlXG4gICAgICBjb25zdCB0ZW1wbGF0ZUtleSA9IGFzdC5uYW1lLnN1YnN0cmluZyhURU1QTEFURV9BVFRSX1BSRUZJWC5sZW5ndGgpO1xuICAgICAgY29uc3QgdGVtcGxhdGVWYWx1ZSA9IGFzdC5zb3VyY2VTcGFuLnRvU3RyaW5nKCk7XG4gICAgICBjb25zdCB0ZW1wbGF0ZVVybCA9IGFzdC5zb3VyY2VTcGFuLnN0YXJ0LmZpbGUudXJsO1xuICAgICAgLy8gVE9ETyhreWxpYXUpOiBXZSBhcmUgdW5hYmxlIHRvIGRldGVybWluZSB0aGUgYWJzb2x1dGUgb2Zmc2V0IG9mIHRoZSBrZXlcbiAgICAgIC8vIGJ1dCBpdCBpcyBva2F5IGhlcmUsIGJlY2F1c2Ugd2UgYXJlIG9ubHkgbG9va2luZyBhdCB0aGUgUkhTIG9mIHRoZSBhdHRyXG4gICAgICBjb25zdCBhYnNLZXlPZmZzZXQgPSAwO1xuICAgICAgY29uc3QgYWJzVmFsdWVPZmZzZXQgPSBhc3Quc291cmNlU3Bhbi5zdGFydC5vZmZzZXQ7XG4gICAgICBjb25zdCB7dGVtcGxhdGVCaW5kaW5nc30gPSB0aGlzLmluZm8uZXhwcmVzc2lvblBhcnNlci5wYXJzZVRlbXBsYXRlQmluZGluZ3MoXG4gICAgICAgICAgdGVtcGxhdGVLZXksIHRlbXBsYXRlVmFsdWUsIHRlbXBsYXRlVXJsLCBhYnNLZXlPZmZzZXQsIGFic1ZhbHVlT2Zmc2V0KTtcbiAgICAgIC8vIEZpbmQgdGhlIHRlbXBsYXRlIGJpbmRpbmcgdGhhdCBjb250YWlucyB0aGUgcG9zaXRpb24uXG4gICAgICBjb25zdCBiaW5kaW5nID0gdGVtcGxhdGVCaW5kaW5ncy5maW5kKGIgPT4gaW5TcGFuKHRoaXMucG9zaXRpb24sIGIuc291cmNlU3BhbikpO1xuXG4gICAgICBpZiAoIWJpbmRpbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm1pY3JvU3ludGF4SW5BdHRyaWJ1dGVWYWx1ZShhc3QsIGJpbmRpbmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleHByZXNzaW9uQXN0ID0gdGhpcy5pbmZvLmV4cHJlc3Npb25QYXJzZXIucGFyc2VCaW5kaW5nKFxuICAgICAgICAgIGFzdC52YWx1ZSwgYXN0LnNvdXJjZVNwYW4udG9TdHJpbmcoKSwgYXN0LnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0KTtcbiAgICAgIHRoaXMucHJvY2Vzc0V4cHJlc3Npb25Db21wbGV0aW9ucyhleHByZXNzaW9uQXN0KTtcbiAgICB9XG4gIH1cblxuICB2aXNpdFJlZmVyZW5jZShfYXN0OiBSZWZlcmVuY2VBc3QsIGNvbnRleHQ6IEVsZW1lbnRBc3QpIHtcbiAgICBjb250ZXh0LmRpcmVjdGl2ZXMuZm9yRWFjaChkaXIgPT4ge1xuICAgICAgY29uc3Qge2V4cG9ydEFzfSA9IGRpci5kaXJlY3RpdmU7XG4gICAgICBpZiAoZXhwb3J0QXMpIHtcbiAgICAgICAgdGhpcy5jb21wbGV0aW9ucy5zZXQoXG4gICAgICAgICAgICBleHBvcnRBcywge25hbWU6IGV4cG9ydEFzLCBraW5kOiBuZy5Db21wbGV0aW9uS2luZC5SRUZFUkVOQ0UsIHNvcnRUZXh0OiBleHBvcnRBc30pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdmlzaXRCb3VuZFRleHQoYXN0OiBCb3VuZFRleHRBc3QpIHtcbiAgICBpZiAoaW5TcGFuKHRoaXMucG9zaXRpb24sIGFzdC52YWx1ZS5zb3VyY2VTcGFuKSkge1xuICAgICAgY29uc3QgY29tcGxldGlvbnMgPSBnZXRFeHByZXNzaW9uQ29tcGxldGlvbnMoXG4gICAgICAgICAgdGhpcy5nZXRFeHByZXNzaW9uU2NvcGUoKSwgYXN0LnZhbHVlLCB0aGlzLnBvc2l0aW9uLCB0aGlzLmluZm8udGVtcGxhdGUpO1xuICAgICAgaWYgKGNvbXBsZXRpb25zKSB7XG4gICAgICAgIHRoaXMuYWRkU3ltYm9sc1RvQ29tcGxldGlvbnMoY29tcGxldGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcHJvY2Vzc0V4cHJlc3Npb25Db21wbGV0aW9ucyh2YWx1ZTogQVNUKSB7XG4gICAgY29uc3Qgc3ltYm9scyA9IGdldEV4cHJlc3Npb25Db21wbGV0aW9ucyhcbiAgICAgICAgdGhpcy5nZXRFeHByZXNzaW9uU2NvcGUoKSwgdmFsdWUsIHRoaXMucG9zaXRpb24sIHRoaXMuaW5mby50ZW1wbGF0ZSk7XG4gICAgaWYgKHN5bWJvbHMpIHtcbiAgICAgIHRoaXMuYWRkU3ltYm9sc1RvQ29tcGxldGlvbnMoc3ltYm9scyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRTeW1ib2xzVG9Db21wbGV0aW9ucyhzeW1ib2xzOiBuZy5TeW1ib2xbXSkge1xuICAgIGZvciAoY29uc3QgcyBvZiBzeW1ib2xzKSB7XG4gICAgICBpZiAocy5uYW1lLnN0YXJ0c1dpdGgoJ19fJykgfHwgIXMucHVibGljIHx8IHRoaXMuY29tcGxldGlvbnMuaGFzKHMubmFtZSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBwaXBlIG1ldGhvZCBzaG91bGQgbm90IGluY2x1ZGUgcGFyZW50aGVzZXMuXG4gICAgICAvLyBlLmcuIHt7IHZhbHVlX2V4cHJlc3Npb24gfCBzbGljZSA6IHN0YXJ0IFsgOiBlbmQgXSB9fVxuICAgICAgY29uc3Qgc2hvdWxkSW5zZXJ0UGFyZW50aGVzZXMgPSBzLmNhbGxhYmxlICYmIHMua2luZCAhPT0gbmcuQ29tcGxldGlvbktpbmQuUElQRTtcbiAgICAgIHRoaXMuY29tcGxldGlvbnMuc2V0KHMubmFtZSwge1xuICAgICAgICBuYW1lOiBzLm5hbWUsXG4gICAgICAgIGtpbmQ6IHMua2luZCBhcyBuZy5Db21wbGV0aW9uS2luZCxcbiAgICAgICAgc29ydFRleHQ6IHMubmFtZSxcbiAgICAgICAgaW5zZXJ0VGV4dDogc2hvdWxkSW5zZXJ0UGFyZW50aGVzZXMgPyBgJHtzLm5hbWV9KClgIDogcy5uYW1lLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdGhlIGNvbXBsZXRpb25zIG9mIGF0dHJpYnV0ZSB2YWx1ZXMgZm9yIGRpcmVjdGl2ZXMgdGhhdFxuICAgKiBzdXBwb3J0IHRoZSBtaWNyb3N5bnRheCBmb3JtYXQuIEV4YW1wbGVzIGFyZSAqbmdGb3IgYW5kICpuZ0lmLlxuICAgKiBUaGVzZSBkaXJlY3RpdmVzIGFsbG93cyBkZWNsYXJhdGlvbiBvZiBcImxldFwiIHZhcmlhYmxlcywgYWRkcyBjb250ZXh0LXNwZWNpZmljXG4gICAqIHN5bWJvbHMgbGlrZSAkaW1wbGljaXQsIGluZGV4LCBjb3VudCwgYW1vbmcgb3RoZXIgYmVoYXZpb3JzLlxuICAgKiBGb3IgYSBjb21wbGV0ZSBkZXNjcmlwdGlvbiBvZiBzdWNoIGZvcm1hdCwgc2VlXG4gICAqIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9zdHJ1Y3R1cmFsLWRpcmVjdGl2ZXMjdGhlLWFzdGVyaXNrLS1wcmVmaXhcbiAgICpcbiAgICogQHBhcmFtIGF0dHIgZGVzY3JpcHRvciBmb3IgYXR0cmlidXRlIG5hbWUgYW5kIHZhbHVlIHBhaXJcbiAgICogQHBhcmFtIGJpbmRpbmcgdGVtcGxhdGUgYmluZGluZyBmb3IgdGhlIGV4cHJlc3Npb24gaW4gdGhlIGF0dHJpYnV0ZVxuICAgKi9cbiAgcHJpdmF0ZSBtaWNyb1N5bnRheEluQXR0cmlidXRlVmFsdWUoYXR0cjogQXR0ckFzdCwgYmluZGluZzogVGVtcGxhdGVCaW5kaW5nKSB7XG4gICAgY29uc3Qga2V5ID0gYXR0ci5uYW1lLnN1YnN0cmluZygxKTsgIC8vIHJlbW92ZSBsZWFkaW5nIGFzdGVyaXNrXG5cbiAgICAvLyBGaW5kIHRoZSBzZWxlY3RvciAtIGVnIG5nRm9yLCBuZ0lmLCBldGNcbiAgICBjb25zdCBzZWxlY3RvckluZm8gPSBnZXRTZWxlY3RvcnModGhpcy5pbmZvKTtcbiAgICBjb25zdCBzZWxlY3RvciA9IHNlbGVjdG9ySW5mby5zZWxlY3RvcnMuZmluZChzID0+IHtcbiAgICAgIC8vIGF0dHJpYnV0ZXMgYXJlIGxpc3RlZCBpbiAoYXR0cmlidXRlLCB2YWx1ZSkgcGFpcnNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcy5hdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBpZiAocy5hdHRyc1tpXSA9PT0ga2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghc2VsZWN0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZVJlbGF0aXZlUG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uIC0gYXR0ci5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldDtcblxuICAgIGlmIChiaW5kaW5nIGluc3RhbmNlb2YgVmFyaWFibGVCaW5kaW5nKSB7XG4gICAgICAvLyBUT0RPKGt5bGlhdSk6IFdpdGggZXhwcmVzc2lvbiBzb3VyY2VTcGFuIHdlIHNob3VsZG4ndCBoYXZlIHRvIHNlYXJjaFxuICAgICAgLy8gdGhlIGF0dHJpYnV0ZSB2YWx1ZSBzdHJpbmcgYW55bW9yZS4gSnVzdCBjaGVjayBpZiBwb3NpdGlvbiBpcyBpbiB0aGVcbiAgICAgIC8vIGV4cHJlc3Npb24gc291cmNlIHNwYW4uXG4gICAgICBjb25zdCBlcXVhbExvY2F0aW9uID0gYXR0ci52YWx1ZS5pbmRleE9mKCc9Jyk7XG4gICAgICBpZiAoZXF1YWxMb2NhdGlvbiA+IDAgJiYgdmFsdWVSZWxhdGl2ZVBvc2l0aW9uID4gZXF1YWxMb2NhdGlvbikge1xuICAgICAgICAvLyBXZSBhcmUgYWZ0ZXIgdGhlICc9JyBpbiBhIGxldCBjbGF1c2UuIFRoZSB2YWxpZCB2YWx1ZXMgaGVyZSBhcmUgdGhlIG1lbWJlcnMgb2YgdGhlXG4gICAgICAgIC8vIHRlbXBsYXRlIHJlZmVyZW5jZSdzIHR5cGUgcGFyYW1ldGVyLlxuICAgICAgICBjb25zdCBkaXJlY3RpdmVNZXRhZGF0YSA9IHNlbGVjdG9ySW5mby5tYXAuZ2V0KHNlbGVjdG9yKTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZU1ldGFkYXRhKSB7XG4gICAgICAgICAgY29uc3QgY29udGV4dFRhYmxlID1cbiAgICAgICAgICAgICAgdGhpcy5pbmZvLnRlbXBsYXRlLnF1ZXJ5LmdldFRlbXBsYXRlQ29udGV4dChkaXJlY3RpdmVNZXRhZGF0YS50eXBlLnJlZmVyZW5jZSk7XG4gICAgICAgICAgaWYgKGNvbnRleHRUYWJsZSkge1xuICAgICAgICAgICAgLy8gVGhpcyBhZGRzIHN5bWJvbHMgbGlrZSAkaW1wbGljaXQsIGluZGV4LCBjb3VudCwgZXRjLlxuICAgICAgICAgICAgdGhpcy5hZGRTeW1ib2xzVG9Db21wbGV0aW9ucyhjb250ZXh0VGFibGUudmFsdWVzKCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChpblNwYW4odmFsdWVSZWxhdGl2ZVBvc2l0aW9uLCBiaW5kaW5nLnZhbHVlPy5hc3Quc3BhbikpIHtcbiAgICAgIHRoaXMucHJvY2Vzc0V4cHJlc3Npb25Db21wbGV0aW9ucyhiaW5kaW5nLnZhbHVlICEuYXN0KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZXhwcmVzc2lvbiBpcyBpbmNvbXBsZXRlLCBmb3IgZXhhbXBsZSAqbmdGb3I9XCJsZXQgeCBvZiB8XCJcbiAgICAvLyBiaW5kaW5nLmV4cHJlc3Npb24gaXMgbnVsbC4gV2UgY291bGQgc3RpbGwgdHJ5IHRvIHByb3ZpZGUgc3VnZ2VzdGlvbnNcbiAgICAvLyBieSBsb29raW5nIGZvciBzeW1ib2xzIHRoYXQgYXJlIGluIHNjb3BlLlxuICAgIGNvbnN0IEtXX09GID0gJyBvZiAnO1xuICAgIGNvbnN0IG9mTG9jYXRpb24gPSBhdHRyLnZhbHVlLmluZGV4T2YoS1dfT0YpO1xuICAgIGlmIChvZkxvY2F0aW9uID4gMCAmJiB2YWx1ZVJlbGF0aXZlUG9zaXRpb24gPj0gb2ZMb2NhdGlvbiArIEtXX09GLmxlbmd0aCkge1xuICAgICAgY29uc3QgZXhwcmVzc2lvbkFzdCA9IHRoaXMuaW5mby5leHByZXNzaW9uUGFyc2VyLnBhcnNlQmluZGluZyhcbiAgICAgICAgICBhdHRyLnZhbHVlLCBhdHRyLnNvdXJjZVNwYW4udG9TdHJpbmcoKSwgYXR0ci5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCk7XG4gICAgICB0aGlzLnByb2Nlc3NFeHByZXNzaW9uQ29tcGxldGlvbnMoZXhwcmVzc2lvbkFzdCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZVRleHQodGVtcGxhdGU6IG5nLlRlbXBsYXRlU291cmNlLCBzcGFuOiBuZy5TcGFuKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRlbXBsYXRlLnNvdXJjZS5zdWJzdHJpbmcoc3Bhbi5zdGFydCwgc3Bhbi5lbmQpO1xufVxuXG5pbnRlcmZhY2UgQW5ndWxhckF0dHJpYnV0ZXMge1xuICAvKipcbiAgICogQXR0cmlidXRlcyB0aGF0IHN1cHBvcnQgdGhlICogc3ludGF4LiBTZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2FwaS9jb3JlL1RlbXBsYXRlUmVmXG4gICAqL1xuICB0ZW1wbGF0ZVJlZnM6IFNldDxzdHJpbmc+O1xuICAvKipcbiAgICogQXR0cmlidXRlcyB3aXRoIHRoZSBASW5wdXQgYW5ub3RhdGlvbi5cbiAgICovXG4gIGlucHV0czogU2V0PHN0cmluZz47XG4gIC8qKlxuICAgKiBBdHRyaWJ1dGVzIHdpdGggdGhlIEBPdXRwdXQgYW5ub3RhdGlvbi5cbiAgICovXG4gIG91dHB1dHM6IFNldDxzdHJpbmc+O1xuICAvKipcbiAgICogQXR0cmlidXRlcyB0aGF0IHN1cHBvcnQgdGhlIFsoKV0gb3IgYmluZG9uLSBzeW50YXguXG4gICAqL1xuICBiYW5hbmFzOiBTZXQ8c3RyaW5nPjtcbiAgLyoqXG4gICAqIEdlbmVyYWwgYXR0cmlidXRlcyB0aGF0IG1hdGNoIHRoZSBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICovXG4gIG90aGVyczogU2V0PHN0cmluZz47XG59XG5cbi8qKlxuICogUmV0dXJuIGFsbCBBbmd1bGFyLXNwZWNpZmljIGF0dHJpYnV0ZXMgZm9yIHRoZSBlbGVtZW50IHdpdGggYGVsZW1lbnROYW1lYC5cbiAqIEBwYXJhbSBpbmZvXG4gKiBAcGFyYW0gZWxlbWVudE5hbWVcbiAqL1xuZnVuY3Rpb24gYW5ndWxhckF0dHJpYnV0ZXMoaW5mbzogQXN0UmVzdWx0LCBlbGVtZW50TmFtZTogc3RyaW5nKTogQW5ndWxhckF0dHJpYnV0ZXMge1xuICBjb25zdCB7c2VsZWN0b3JzLCBtYXA6IHNlbGVjdG9yTWFwfSA9IGdldFNlbGVjdG9ycyhpbmZvKTtcbiAgY29uc3QgdGVtcGxhdGVSZWZzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGlucHV0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBvdXRwdXRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IGJhbmFuYXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3Qgb3RoZXJzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3Qgc2VsZWN0b3Igb2Ygc2VsZWN0b3JzKSB7XG4gICAgaWYgKHNlbGVjdG9yLmVsZW1lbnQgJiYgc2VsZWN0b3IuZWxlbWVudCAhPT0gZWxlbWVudE5hbWUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBzdW1tYXJ5ID0gc2VsZWN0b3JNYXAuZ2V0KHNlbGVjdG9yKSAhO1xuICAgIGNvbnN0IGhhc1RlbXBsYXRlUmVmID0gaXNTdHJ1Y3R1cmFsRGlyZWN0aXZlKHN1bW1hcnkudHlwZSk7XG4gICAgLy8gYXR0cmlidXRlcyBhcmUgbGlzdGVkIGluIChhdHRyaWJ1dGUsIHZhbHVlKSBwYWlyc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IuYXR0cnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBzZWxlY3Rvci5hdHRyc1tpXTtcbiAgICAgIGlmIChoYXNUZW1wbGF0ZVJlZikge1xuICAgICAgICB0ZW1wbGF0ZVJlZnMuYWRkKGF0dHIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3RoZXJzLmFkZChhdHRyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChjb25zdCBpbnB1dCBvZiBPYmplY3QudmFsdWVzKHN1bW1hcnkuaW5wdXRzKSkge1xuICAgICAgaW5wdXRzLmFkZChpbnB1dCk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qgb3V0cHV0IG9mIE9iamVjdC52YWx1ZXMoc3VtbWFyeS5vdXRwdXRzKSkge1xuICAgICAgb3V0cHV0cy5hZGQob3V0cHV0KTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBuYW1lIG9mIGlucHV0cykge1xuICAgIC8vIEFkZCBiYW5hbmEtaW4tYS1ib3ggc3ludGF4XG4gICAgLy8gaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL3RlbXBsYXRlLXN5bnRheCN0d28td2F5LWJpbmRpbmctXG4gICAgaWYgKG91dHB1dHMuaGFzKGAke25hbWV9Q2hhbmdlYCkpIHtcbiAgICAgIGJhbmFuYXMuYWRkKG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge3RlbXBsYXRlUmVmcywgaW5wdXRzLCBvdXRwdXRzLCBiYW5hbmFzLCBvdGhlcnN9O1xufVxuIl19