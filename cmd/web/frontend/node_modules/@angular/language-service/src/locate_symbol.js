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
        define("@angular/language-service/src/locate_symbol", ["require", "exports", "tslib", "@angular/compiler", "typescript/lib/tsserverlibrary", "@angular/language-service/src/expression_diagnostics", "@angular/language-service/src/expressions", "@angular/language-service/src/types", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var tss = require("typescript/lib/tsserverlibrary");
    var expression_diagnostics_1 = require("@angular/language-service/src/expression_diagnostics");
    var expressions_1 = require("@angular/language-service/src/expressions");
    var types_1 = require("@angular/language-service/src/types");
    var utils_1 = require("@angular/language-service/src/utils");
    /**
     * Traverses a template AST and locates symbol(s) at a specified position.
     * @param info template AST information set
     * @param position location to locate symbols at
     */
    function locateSymbols(info, position) {
        var templatePosition = position - info.template.span.start;
        // TODO: update `findTemplateAstAt` to use absolute positions.
        var path = utils_1.findTemplateAstAt(info.templateAst, templatePosition);
        var attribute = findAttribute(info, position);
        if (!path.tail)
            return [];
        var narrowest = utils_1.spanOf(path.tail);
        var toVisit = [];
        for (var node = path.tail; node && utils_1.isNarrower(utils_1.spanOf(node.sourceSpan), narrowest); node = path.parentOf(node)) {
            toVisit.push(node);
        }
        // For the structural directive, only care about the last template AST.
        if (attribute === null || attribute === void 0 ? void 0 : attribute.name.startsWith('*')) {
            toVisit.splice(0, toVisit.length - 1);
        }
        return toVisit.map(function (ast) { return locateSymbol(ast, path, info); })
            .filter(function (sym) { return sym !== undefined; });
    }
    exports.locateSymbols = locateSymbols;
    /**
     * Visits a template node and locates the symbol in that node at a path position.
     * @param ast template AST node to visit
     * @param path non-empty set of narrowing AST nodes at a position
     * @param info template AST information set
     */
    function locateSymbol(ast, path, info) {
        var templatePosition = path.position;
        var position = templatePosition + info.template.span.start;
        var symbol;
        var span;
        var staticSymbol;
        var attributeValueSymbol = function (ast) {
            var attribute = findAttribute(info, position);
            if (attribute) {
                if (utils_1.inSpan(templatePosition, utils_1.spanOf(attribute.valueSpan))) {
                    var result = void 0;
                    if (attribute.name.startsWith('*')) {
                        result = getSymbolInMicrosyntax(info, path, attribute);
                    }
                    else {
                        var dinfo = utils_1.diagnosticInfoFromTemplateInfo(info);
                        var scope = expression_diagnostics_1.getExpressionScope(dinfo, path);
                        result = expressions_1.getExpressionSymbol(scope, ast, templatePosition, info.template);
                    }
                    if (result) {
                        symbol = result.symbol;
                        span = utils_1.offsetSpan(result.span, attribute.valueSpan.start.offset);
                    }
                    return true;
                }
            }
            return false;
        };
        ast.visit({
            visitNgContent: function (ast) { },
            visitEmbeddedTemplate: function (ast) { },
            visitElement: function (ast) {
                var component = ast.directives.find(function (d) { return d.directive.isComponent; });
                if (component) {
                    // Need to cast because 'reference' is typed as any
                    staticSymbol = component.directive.type.reference;
                    symbol = info.template.query.getTypeSymbol(staticSymbol);
                    symbol = symbol && new OverrideKindSymbol(symbol, types_1.DirectiveKind.COMPONENT);
                    span = utils_1.spanOf(ast);
                }
                else {
                    // Find a directive that matches the element name
                    var directive = ast.directives.find(function (d) { return d.directive.selector != null && d.directive.selector.indexOf(ast.name) >= 0; });
                    if (directive) {
                        // Need to cast because 'reference' is typed as any
                        staticSymbol = directive.directive.type.reference;
                        symbol = info.template.query.getTypeSymbol(staticSymbol);
                        symbol = symbol && new OverrideKindSymbol(symbol, types_1.DirectiveKind.DIRECTIVE);
                        span = utils_1.spanOf(ast);
                    }
                }
            },
            visitReference: function (ast) {
                symbol = ast.value && info.template.query.getTypeSymbol(compiler_1.tokenReference(ast.value));
                span = utils_1.spanOf(ast);
            },
            visitVariable: function (ast) { },
            visitEvent: function (ast) {
                if (!attributeValueSymbol(ast.handler)) {
                    symbol = utils_1.findOutputBinding(ast, path, info.template.query);
                    symbol = symbol && new OverrideKindSymbol(symbol, types_1.DirectiveKind.EVENT);
                    span = utils_1.spanOf(ast);
                }
            },
            visitElementProperty: function (ast) { attributeValueSymbol(ast.value); },
            visitAttr: function (ast) {
                var e_1, _a;
                var element = path.first(compiler_1.ElementAst);
                if (!element)
                    return;
                // Create a mapping of all directives applied to the element from their selectors.
                var matcher = new compiler_1.SelectorMatcher();
                try {
                    for (var _b = tslib_1.__values(element.directives), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var dir = _c.value;
                        if (!dir.directive.selector)
                            continue;
                        matcher.addSelectables(compiler_1.CssSelector.parse(dir.directive.selector), dir);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                // See if this attribute matches the selector of any directive on the element.
                var attributeSelector = "[" + ast.name + "=" + ast.value + "]";
                var parsedAttribute = compiler_1.CssSelector.parse(attributeSelector);
                if (!parsedAttribute.length)
                    return;
                matcher.match(parsedAttribute[0], function (_, _a) {
                    var directive = _a.directive;
                    // Need to cast because 'reference' is typed as any
                    staticSymbol = directive.type.reference;
                    symbol = info.template.query.getTypeSymbol(staticSymbol);
                    symbol = symbol && new OverrideKindSymbol(symbol, types_1.DirectiveKind.DIRECTIVE);
                    span = utils_1.spanOf(ast);
                });
            },
            visitBoundText: function (ast) {
                var expressionPosition = templatePosition - ast.sourceSpan.start.offset;
                if (utils_1.inSpan(expressionPosition, ast.value.span)) {
                    var dinfo = utils_1.diagnosticInfoFromTemplateInfo(info);
                    var scope = expression_diagnostics_1.getExpressionScope(dinfo, path);
                    var result = expressions_1.getExpressionSymbol(scope, ast.value, templatePosition, info.template);
                    if (result) {
                        symbol = result.symbol;
                        span = utils_1.offsetSpan(result.span, ast.sourceSpan.start.offset);
                    }
                }
            },
            visitText: function (ast) { },
            visitDirective: function (ast) {
                // Need to cast because 'reference' is typed as any
                staticSymbol = ast.directive.type.reference;
                symbol = info.template.query.getTypeSymbol(staticSymbol);
                span = utils_1.spanOf(ast);
            },
            visitDirectiveProperty: function (ast) {
                if (!attributeValueSymbol(ast.value)) {
                    var directive = findParentOfBinding(info.templateAst, ast, templatePosition);
                    var attribute = findAttribute(info, position);
                    if (directive && attribute) {
                        if (attribute.name.startsWith('*')) {
                            var compileTypeSummary = directive.directive;
                            symbol = info.template.query.getTypeSymbol(compileTypeSummary.type.reference);
                            symbol = symbol && new OverrideKindSymbol(symbol, types_1.DirectiveKind.DIRECTIVE);
                            // Use 'attribute.sourceSpan' instead of the directive's,
                            // because the span of the directive is the whole opening tag of an element.
                            span = utils_1.spanOf(attribute.sourceSpan);
                        }
                        else {
                            symbol = findInputBinding(info, ast.templateName, directive);
                            span = utils_1.spanOf(ast);
                        }
                    }
                }
            }
        }, null);
        if (symbol && span) {
            var _a = utils_1.offsetSpan(span, info.template.span.start), start = _a.start, end = _a.end;
            return {
                symbol: symbol,
                span: tss.createTextSpanFromBounds(start, end), staticSymbol: staticSymbol,
            };
        }
    }
    // Get the symbol in microsyntax at template position.
    function getSymbolInMicrosyntax(info, path, attribute) {
        var e_2, _a;
        var _b;
        if (!attribute.valueSpan) {
            return;
        }
        var absValueOffset = attribute.valueSpan.start.offset;
        var result;
        var templateBindings = info.expressionParser.parseTemplateBindings(attribute.name, attribute.value, attribute.sourceSpan.toString(), attribute.sourceSpan.start.offset, attribute.valueSpan.start.offset).templateBindings;
        try {
            // Find the symbol that contains the position.
            for (var templateBindings_1 = tslib_1.__values(templateBindings), templateBindings_1_1 = templateBindings_1.next(); !templateBindings_1_1.done; templateBindings_1_1 = templateBindings_1.next()) {
                var tb = templateBindings_1_1.value;
                if (tb instanceof compiler_1.VariableBinding) {
                    // TODO(kyliau): if binding is variable we should still look for the value
                    // of the key. For example, "let i=index" => "index" should point to
                    // NgForOfContext.index
                    continue;
                }
                if (utils_1.inSpan(path.position, (_b = tb.value) === null || _b === void 0 ? void 0 : _b.ast.sourceSpan)) {
                    var dinfo = utils_1.diagnosticInfoFromTemplateInfo(info);
                    var scope = expression_diagnostics_1.getExpressionScope(dinfo, path);
                    result = expressions_1.getExpressionSymbol(scope, tb.value, path.position, info.template);
                }
                else if (utils_1.inSpan(path.position, tb.sourceSpan)) {
                    var template = path.first(compiler_1.EmbeddedTemplateAst);
                    if (template) {
                        // One element can only have one template binding.
                        var directiveAst = template.directives[0];
                        if (directiveAst) {
                            var symbol = findInputBinding(info, tb.key.source.substring(1), directiveAst);
                            if (symbol) {
                                result = {
                                    symbol: symbol,
                                    // the span here has to be relative to the start of the template
                                    // value so deduct the absolute offset.
                                    // TODO(kyliau): Use absolute source span throughout completions.
                                    span: utils_1.offsetSpan(tb.key.span, -absValueOffset),
                                };
                            }
                        }
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (templateBindings_1_1 && !templateBindings_1_1.done && (_a = templateBindings_1.return)) _a.call(templateBindings_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return result;
    }
    function findAttribute(info, position) {
        var templatePosition = position - info.template.span.start;
        var path = utils_1.getPathToNodeAtPosition(info.htmlAst, templatePosition);
        return path.first(compiler_1.Attribute);
    }
    // TODO: remove this function after the path includes 'DirectiveAst'.
    // Find the directive that corresponds to the specified 'binding'
    // at the specified 'position' in the 'ast'.
    function findParentOfBinding(ast, binding, position) {
        var res;
        var visitor = new /** @class */ (function (_super) {
            tslib_1.__extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.visit = function (ast) {
                var span = utils_1.spanOf(ast);
                if (!utils_1.inSpan(position, span)) {
                    // Returning a value here will result in the children being skipped.
                    return true;
                }
            };
            class_1.prototype.visitEmbeddedTemplate = function (ast, context) {
                return this.visitChildren(context, function (visit) {
                    visit(ast.directives);
                    visit(ast.children);
                });
            };
            class_1.prototype.visitElement = function (ast, context) {
                return this.visitChildren(context, function (visit) {
                    visit(ast.directives);
                    visit(ast.children);
                });
            };
            class_1.prototype.visitDirective = function (ast) {
                var result = this.visitChildren(ast, function (visit) { visit(ast.inputs); });
                return result;
            };
            class_1.prototype.visitDirectiveProperty = function (ast, context) {
                if (ast === binding) {
                    res = context;
                }
            };
            return class_1;
        }(compiler_1.RecursiveTemplateAstVisitor));
        compiler_1.templateVisitAll(visitor, ast);
        return res;
    }
    // Find the symbol of input binding in 'directiveAst' by 'name'.
    function findInputBinding(info, name, directiveAst) {
        var invertedInput = utils_1.invertMap(directiveAst.directive.inputs);
        var fieldName = invertedInput[name];
        if (fieldName) {
            var classSymbol = info.template.query.getTypeSymbol(directiveAst.directive.type.reference);
            if (classSymbol) {
                return classSymbol.members().get(fieldName);
            }
        }
    }
    /**
     * Wrap a symbol and change its kind to component.
     */
    var OverrideKindSymbol = /** @class */ (function () {
        function OverrideKindSymbol(sym, kindOverride) {
            this.sym = sym;
            this.kind = kindOverride;
        }
        Object.defineProperty(OverrideKindSymbol.prototype, "name", {
            get: function () { return this.sym.name; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "language", {
            get: function () { return this.sym.language; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "type", {
            get: function () { return this.sym.type; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "container", {
            get: function () { return this.sym.container; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "public", {
            get: function () { return this.sym.public; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "callable", {
            get: function () { return this.sym.callable; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "nullable", {
            get: function () { return this.sym.nullable; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "definition", {
            get: function () { return this.sym.definition; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OverrideKindSymbol.prototype, "documentation", {
            get: function () { return this.sym.documentation; },
            enumerable: true,
            configurable: true
        });
        OverrideKindSymbol.prototype.members = function () { return this.sym.members(); };
        OverrideKindSymbol.prototype.signatures = function () { return this.sym.signatures(); };
        OverrideKindSymbol.prototype.selectSignature = function (types) { return this.sym.selectSignature(types); };
        OverrideKindSymbol.prototype.indexed = function (argument) { return this.sym.indexed(argument); };
        OverrideKindSymbol.prototype.typeArguments = function () { return this.sym.typeArguments(); };
        return OverrideKindSymbol;
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYXRlX3N5bWJvbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2xhbmd1YWdlLXNlcnZpY2Uvc3JjL2xvY2F0ZV9zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQXFSO0lBQ3JSLG9EQUFzRDtJQUd0RCwrRkFBNEQ7SUFDNUQseUVBQWtEO0lBQ2xELDZEQUFnRTtJQUNoRSw2REFBeUs7SUFReks7Ozs7T0FJRztJQUNILFNBQWdCLGFBQWEsQ0FBQyxJQUFlLEVBQUUsUUFBZ0I7UUFDN0QsSUFBTSxnQkFBZ0IsR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzdELDhEQUE4RDtRQUM5RCxJQUFNLElBQUksR0FBRyx5QkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDbkUsSUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVoRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPLEVBQUUsQ0FBQztRQUUxQixJQUFNLFNBQVMsR0FBRyxjQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLElBQU0sT0FBTyxHQUFrQixFQUFFLENBQUM7UUFDbEMsS0FBSyxJQUFJLElBQUksR0FBMEIsSUFBSSxDQUFDLElBQUksRUFDM0MsSUFBSSxJQUFJLGtCQUFVLENBQUMsY0FBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2RixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3BCO1FBRUQsdUVBQXVFO1FBQ3ZFLElBQUksU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHO1lBQ25DLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDdkM7UUFFRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBN0IsQ0FBNkIsQ0FBQzthQUNuRCxNQUFNLENBQUMsVUFBQyxHQUFHLElBQXdCLE9BQUEsR0FBRyxLQUFLLFNBQVMsRUFBakIsQ0FBaUIsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUF0QkQsc0NBc0JDO0lBRUQ7Ozs7O09BS0c7SUFDSCxTQUFTLFlBQVksQ0FBQyxHQUFnQixFQUFFLElBQXFCLEVBQUUsSUFBZTtRQUU1RSxJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdkMsSUFBTSxRQUFRLEdBQUcsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzdELElBQUksTUFBd0IsQ0FBQztRQUM3QixJQUFJLElBQW9CLENBQUM7UUFDekIsSUFBSSxZQUFvQyxDQUFDO1FBQ3pDLElBQU0sb0JBQW9CLEdBQUcsVUFBQyxHQUFRO1lBQ3BDLElBQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEQsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsSUFBSSxjQUFNLENBQUMsZ0JBQWdCLEVBQUUsY0FBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFO29CQUN6RCxJQUFJLE1BQU0sU0FBd0MsQ0FBQztvQkFDbkQsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDbEMsTUFBTSxHQUFHLHNCQUFzQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7cUJBQ3hEO3lCQUFNO3dCQUNMLElBQU0sS0FBSyxHQUFHLHNDQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNuRCxJQUFNLEtBQUssR0FBRywyQ0FBa0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQzlDLE1BQU0sR0FBRyxpQ0FBbUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDM0U7b0JBQ0QsSUFBSSxNQUFNLEVBQUU7d0JBQ1YsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7d0JBQ3ZCLElBQUksR0FBRyxrQkFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLFNBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQ3BFO29CQUNELE9BQU8sSUFBSSxDQUFDO2lCQUNiO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQztRQUNGLEdBQUcsQ0FBQyxLQUFLLENBQ0w7WUFDRSxjQUFjLFlBQUMsR0FBRyxJQUFHLENBQUM7WUFDdEIscUJBQXFCLFlBQUMsR0FBRyxJQUFHLENBQUM7WUFDN0IsWUFBWSxFQUFaLFVBQWEsR0FBRztnQkFDZCxJQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUF2QixDQUF1QixDQUFDLENBQUM7Z0JBQ3BFLElBQUksU0FBUyxFQUFFO29CQUNiLG1EQUFtRDtvQkFDbkQsWUFBWSxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQXlCLENBQUM7b0JBQ2xFLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ3pELE1BQU0sR0FBRyxNQUFNLElBQUksSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUscUJBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDM0UsSUFBSSxHQUFHLGNBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDcEI7cUJBQU07b0JBQ0wsaURBQWlEO29CQUNqRCxJQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FDakMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQTNFLENBQTJFLENBQUMsQ0FBQztvQkFDdEYsSUFBSSxTQUFTLEVBQUU7d0JBQ2IsbURBQW1EO3dCQUNuRCxZQUFZLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBeUIsQ0FBQzt3QkFDbEUsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQzt3QkFDekQsTUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxxQkFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUMzRSxJQUFJLEdBQUcsY0FBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUNwQjtpQkFDRjtZQUNILENBQUM7WUFDRCxjQUFjLFlBQUMsR0FBRztnQkFDaEIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLHlCQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ25GLElBQUksR0FBRyxjQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUNELGFBQWEsWUFBQyxHQUFHLElBQUcsQ0FBQztZQUNyQixVQUFVLFlBQUMsR0FBRztnQkFDWixJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUN0QyxNQUFNLEdBQUcseUJBQWlCLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMzRCxNQUFNLEdBQUcsTUFBTSxJQUFJLElBQUksa0JBQWtCLENBQUMsTUFBTSxFQUFFLHFCQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3ZFLElBQUksR0FBRyxjQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ3BCO1lBQ0gsQ0FBQztZQUNELG9CQUFvQixZQUFDLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlELFNBQVMsRUFBVCxVQUFVLEdBQUc7O2dCQUNYLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQVUsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsT0FBTztvQkFBRSxPQUFPO2dCQUNyQixrRkFBa0Y7Z0JBQ2xGLElBQU0sT0FBTyxHQUFHLElBQUksMEJBQWUsRUFBZ0IsQ0FBQzs7b0JBQ3BELEtBQWtCLElBQUEsS0FBQSxpQkFBQSxPQUFPLENBQUMsVUFBVSxDQUFBLGdCQUFBLDRCQUFFO3dCQUFqQyxJQUFNLEdBQUcsV0FBQTt3QkFDWixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFROzRCQUFFLFNBQVM7d0JBQ3RDLE9BQU8sQ0FBQyxjQUFjLENBQUMsc0JBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztxQkFDeEU7Ozs7Ozs7OztnQkFFRCw4RUFBOEU7Z0JBQzlFLElBQU0saUJBQWlCLEdBQUcsTUFBSSxHQUFHLENBQUMsSUFBSSxTQUFJLEdBQUcsQ0FBQyxLQUFLLE1BQUcsQ0FBQztnQkFDdkQsSUFBTSxlQUFlLEdBQUcsc0JBQVcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNO29CQUFFLE9BQU87Z0JBQ3BDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQUMsQ0FBQyxFQUFFLEVBQVc7d0JBQVYsd0JBQVM7b0JBQzlDLG1EQUFtRDtvQkFDbkQsWUFBWSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBeUIsQ0FBQztvQkFDeEQsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDekQsTUFBTSxHQUFHLE1BQU0sSUFBSSxJQUFJLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxxQkFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUMzRSxJQUFJLEdBQUcsY0FBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFDRCxjQUFjLFlBQUMsR0FBRztnQkFDaEIsSUFBTSxrQkFBa0IsR0FBRyxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQzFFLElBQUksY0FBTSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzlDLElBQU0sS0FBSyxHQUFHLHNDQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNuRCxJQUFNLEtBQUssR0FBRywyQ0FBa0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzlDLElBQU0sTUFBTSxHQUFHLGlDQUFtQixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDdEYsSUFBSSxNQUFNLEVBQUU7d0JBQ1YsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7d0JBQ3ZCLElBQUksR0FBRyxrQkFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7cUJBQzdEO2lCQUNGO1lBQ0gsQ0FBQztZQUNELFNBQVMsWUFBQyxHQUFHLElBQUcsQ0FBQztZQUNqQixjQUFjLEVBQWQsVUFBZSxHQUFHO2dCQUNoQixtREFBbUQ7Z0JBQ25ELFlBQVksR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUF5QixDQUFDO2dCQUM1RCxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLEdBQUcsY0FBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLENBQUM7WUFDRCxzQkFBc0IsWUFBQyxHQUFHO2dCQUN4QixJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNwQyxJQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO29CQUMvRSxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUNoRCxJQUFJLFNBQVMsSUFBSSxTQUFTLEVBQUU7d0JBQzFCLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUU7NEJBQ2xDLElBQU0sa0JBQWtCLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQzs0QkFDL0MsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7NEJBQzlFLE1BQU0sR0FBRyxNQUFNLElBQUksSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUscUJBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQzs0QkFDM0UseURBQXlEOzRCQUN6RCw0RUFBNEU7NEJBQzVFLElBQUksR0FBRyxjQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3lCQUNyQzs2QkFBTTs0QkFDTCxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7NEJBQzdELElBQUksR0FBRyxjQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQ3BCO3FCQUNGO2lCQUNGO1lBQ0gsQ0FBQztTQUNGLEVBQ0QsSUFBSSxDQUFDLENBQUM7UUFDVixJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUU7WUFDWixJQUFBLHVEQUF5RCxFQUF4RCxnQkFBSyxFQUFFLFlBQWlELENBQUM7WUFDaEUsT0FBTztnQkFDTCxNQUFNLFFBQUE7Z0JBQ04sSUFBSSxFQUFFLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsWUFBWSxjQUFBO2FBQzdELENBQUM7U0FDSDtJQUNILENBQUM7SUFFRCxzREFBc0Q7SUFDdEQsU0FBUyxzQkFBc0IsQ0FBQyxJQUFlLEVBQUUsSUFBcUIsRUFBRSxTQUFvQjs7O1FBRTFGLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQ3hCLE9BQU87U0FDUjtRQUNELElBQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUN4RCxJQUFJLE1BQThDLENBQUM7UUFDNUMsSUFBQSxzTkFBZ0IsQ0FFa0Q7O1lBRXpFLDhDQUE4QztZQUM5QyxLQUFpQixJQUFBLHFCQUFBLGlCQUFBLGdCQUFnQixDQUFBLGtEQUFBLGdGQUFFO2dCQUE5QixJQUFNLEVBQUUsNkJBQUE7Z0JBQ1gsSUFBSSxFQUFFLFlBQVksMEJBQWUsRUFBRTtvQkFDakMsMEVBQTBFO29CQUMxRSxvRUFBb0U7b0JBQ3BFLHVCQUF1QjtvQkFDdkIsU0FBUztpQkFDVjtnQkFDRCxJQUFJLGNBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxRQUFFLEVBQUUsQ0FBQyxLQUFLLDBDQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDbkQsSUFBTSxLQUFLLEdBQUcsc0NBQThCLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ25ELElBQU0sS0FBSyxHQUFHLDJDQUFrQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDOUMsTUFBTSxHQUFHLGlDQUFtQixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUMvRTtxQkFBTSxJQUFJLGNBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDL0MsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyw4QkFBbUIsQ0FBQyxDQUFDO29CQUNqRCxJQUFJLFFBQVEsRUFBRTt3QkFDWixrREFBa0Q7d0JBQ2xELElBQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzVDLElBQUksWUFBWSxFQUFFOzRCQUNoQixJQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDOzRCQUNoRixJQUFJLE1BQU0sRUFBRTtnQ0FDVixNQUFNLEdBQUc7b0NBQ1AsTUFBTSxRQUFBO29DQUNOLGdFQUFnRTtvQ0FDaEUsdUNBQXVDO29DQUN2QyxpRUFBaUU7b0NBQ2pFLElBQUksRUFBRSxrQkFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDO2lDQUMvQyxDQUFDOzZCQUNIO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0Y7Ozs7Ozs7OztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFlLEVBQUUsUUFBZ0I7UUFDdEQsSUFBTSxnQkFBZ0IsR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQzdELElBQU0sSUFBSSxHQUFHLCtCQUF1QixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUNyRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQVMsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCxxRUFBcUU7SUFDckUsaUVBQWlFO0lBQ2pFLDRDQUE0QztJQUM1QyxTQUFTLG1CQUFtQixDQUN4QixHQUFrQixFQUFFLE9BQWtDLEVBQUUsUUFBZ0I7UUFFMUUsSUFBSSxHQUEyQixDQUFDO1FBQ2hDLElBQU0sT0FBTyxHQUFHO1lBQWtCLG1DQUEyQjtZQUF6Qzs7WUFpQ3BCLENBQUM7WUFoQ0MsdUJBQUssR0FBTCxVQUFNLEdBQWdCO2dCQUNwQixJQUFNLElBQUksR0FBRyxjQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxjQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFO29CQUMzQixvRUFBb0U7b0JBQ3BFLE9BQU8sSUFBSSxDQUFDO2lCQUNiO1lBQ0gsQ0FBQztZQUVELHVDQUFxQixHQUFyQixVQUFzQixHQUF3QixFQUFFLE9BQVk7Z0JBQzFELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLO29CQUN0QyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCw4QkFBWSxHQUFaLFVBQWEsR0FBZSxFQUFFLE9BQVk7Z0JBQ3hDLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLO29CQUN0QyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN0QixDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxnQ0FBYyxHQUFkLFVBQWUsR0FBaUI7Z0JBQzlCLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLFVBQUEsS0FBSyxJQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEUsT0FBTyxNQUFNLENBQUM7WUFDaEIsQ0FBQztZQUVELHdDQUFzQixHQUF0QixVQUF1QixHQUE4QixFQUFFLE9BQXFCO2dCQUMxRSxJQUFJLEdBQUcsS0FBSyxPQUFPLEVBQUU7b0JBQ25CLEdBQUcsR0FBRyxPQUFPLENBQUM7aUJBQ2Y7WUFDSCxDQUFDO1lBQ0gsY0FBQztRQUFELENBQUMsQUFqQ21CLENBQWMsc0NBQTJCLEVBaUM1RCxDQUFDO1FBQ0YsMkJBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELGdFQUFnRTtJQUNoRSxTQUFTLGdCQUFnQixDQUFDLElBQWUsRUFBRSxJQUFZLEVBQUUsWUFBMEI7UUFFakYsSUFBTSxhQUFhLEdBQUcsaUJBQVMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9ELElBQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3RixJQUFJLFdBQVcsRUFBRTtnQkFDZixPQUFPLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDN0M7U0FDRjtJQUNILENBQUM7SUFFRDs7T0FFRztJQUNIO1FBRUUsNEJBQW9CLEdBQVcsRUFBRSxZQUEyQjtZQUF4QyxRQUFHLEdBQUgsR0FBRyxDQUFRO1lBQWlDLElBQUksQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDO1FBQUMsQ0FBQztRQUUzRixzQkFBSSxvQ0FBSTtpQkFBUixjQUFxQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7O1dBQUE7UUFFNUMsc0JBQUksd0NBQVE7aUJBQVosY0FBeUIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7OztXQUFBO1FBRXBELHNCQUFJLG9DQUFJO2lCQUFSLGNBQStCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7V0FBQTtRQUV0RCxzQkFBSSx5Q0FBUztpQkFBYixjQUFvQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzs7O1dBQUE7UUFFaEUsc0JBQUksc0NBQU07aUJBQVYsY0FBd0IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7OztXQUFBO1FBRWpELHNCQUFJLHdDQUFRO2lCQUFaLGNBQTBCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzs7V0FBQTtRQUVyRCxzQkFBSSx3Q0FBUTtpQkFBWixjQUEwQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzs7O1dBQUE7UUFFckQsc0JBQUksMENBQVU7aUJBQWQsY0FBK0IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7OztXQUFBO1FBRTVELHNCQUFJLDZDQUFhO2lCQUFqQixjQUE4QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQzs7O1dBQUE7UUFFOUUsb0NBQU8sR0FBUCxjQUFZLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFeEMsdUNBQVUsR0FBVixjQUFlLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFOUMsNENBQWUsR0FBZixVQUFnQixLQUFlLElBQUksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFNUUsb0NBQU8sR0FBUCxVQUFRLFFBQWdCLElBQUksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFaEUsMENBQWEsR0FBYixjQUFzQyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFFLHlCQUFDO0lBQUQsQ0FBQyxBQS9CRCxJQStCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBU1QsIEF0dHJpYnV0ZSwgQm91bmREaXJlY3RpdmVQcm9wZXJ0eUFzdCwgQ3NzU2VsZWN0b3IsIERpcmVjdGl2ZUFzdCwgRWxlbWVudEFzdCwgRW1iZWRkZWRUZW1wbGF0ZUFzdCwgUmVjdXJzaXZlVGVtcGxhdGVBc3RWaXNpdG9yLCBTZWxlY3Rvck1hdGNoZXIsIFN0YXRpY1N5bWJvbCwgVGVtcGxhdGVBc3QsIFRlbXBsYXRlQXN0UGF0aCwgVmFyaWFibGVCaW5kaW5nLCB0ZW1wbGF0ZVZpc2l0QWxsLCB0b2tlblJlZmVyZW5jZX0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgdHNzIGZyb20gJ3R5cGVzY3JpcHQvbGliL3Rzc2VydmVybGlicmFyeSc7XG5cbmltcG9ydCB7QXN0UmVzdWx0fSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQge2dldEV4cHJlc3Npb25TY29wZX0gZnJvbSAnLi9leHByZXNzaW9uX2RpYWdub3N0aWNzJztcbmltcG9ydCB7Z2V0RXhwcmVzc2lvblN5bWJvbH0gZnJvbSAnLi9leHByZXNzaW9ucyc7XG5pbXBvcnQge0RlZmluaXRpb24sIERpcmVjdGl2ZUtpbmQsIFNwYW4sIFN5bWJvbH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2RpYWdub3N0aWNJbmZvRnJvbVRlbXBsYXRlSW5mbywgZmluZE91dHB1dEJpbmRpbmcsIGZpbmRUZW1wbGF0ZUFzdEF0LCBnZXRQYXRoVG9Ob2RlQXRQb3NpdGlvbiwgaW5TcGFuLCBpbnZlcnRNYXAsIGlzTmFycm93ZXIsIG9mZnNldFNwYW4sIHNwYW5PZn0gZnJvbSAnLi91dGlscyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ltYm9sSW5mbyB7XG4gIHN5bWJvbDogU3ltYm9sO1xuICBzcGFuOiB0c3MuVGV4dFNwYW47XG4gIHN0YXRpY1N5bWJvbD86IFN0YXRpY1N5bWJvbDtcbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgYSB0ZW1wbGF0ZSBBU1QgYW5kIGxvY2F0ZXMgc3ltYm9sKHMpIGF0IGEgc3BlY2lmaWVkIHBvc2l0aW9uLlxuICogQHBhcmFtIGluZm8gdGVtcGxhdGUgQVNUIGluZm9ybWF0aW9uIHNldFxuICogQHBhcmFtIHBvc2l0aW9uIGxvY2F0aW9uIHRvIGxvY2F0ZSBzeW1ib2xzIGF0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVTeW1ib2xzKGluZm86IEFzdFJlc3VsdCwgcG9zaXRpb246IG51bWJlcik6IFN5bWJvbEluZm9bXSB7XG4gIGNvbnN0IHRlbXBsYXRlUG9zaXRpb24gPSBwb3NpdGlvbiAtIGluZm8udGVtcGxhdGUuc3Bhbi5zdGFydDtcbiAgLy8gVE9ETzogdXBkYXRlIGBmaW5kVGVtcGxhdGVBc3RBdGAgdG8gdXNlIGFic29sdXRlIHBvc2l0aW9ucy5cbiAgY29uc3QgcGF0aCA9IGZpbmRUZW1wbGF0ZUFzdEF0KGluZm8udGVtcGxhdGVBc3QsIHRlbXBsYXRlUG9zaXRpb24pO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBmaW5kQXR0cmlidXRlKGluZm8sIHBvc2l0aW9uKTtcblxuICBpZiAoIXBhdGgudGFpbCkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IG5hcnJvd2VzdCA9IHNwYW5PZihwYXRoLnRhaWwpO1xuICBjb25zdCB0b1Zpc2l0OiBUZW1wbGF0ZUFzdFtdID0gW107XG4gIGZvciAobGV0IG5vZGU6IFRlbXBsYXRlQXN0fHVuZGVmaW5lZCA9IHBhdGgudGFpbDtcbiAgICAgICBub2RlICYmIGlzTmFycm93ZXIoc3Bhbk9mKG5vZGUuc291cmNlU3BhbiksIG5hcnJvd2VzdCk7IG5vZGUgPSBwYXRoLnBhcmVudE9mKG5vZGUpKSB7XG4gICAgdG9WaXNpdC5wdXNoKG5vZGUpO1xuICB9XG5cbiAgLy8gRm9yIHRoZSBzdHJ1Y3R1cmFsIGRpcmVjdGl2ZSwgb25seSBjYXJlIGFib3V0IHRoZSBsYXN0IHRlbXBsYXRlIEFTVC5cbiAgaWYgKGF0dHJpYnV0ZT8ubmFtZS5zdGFydHNXaXRoKCcqJykpIHtcbiAgICB0b1Zpc2l0LnNwbGljZSgwLCB0b1Zpc2l0Lmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgcmV0dXJuIHRvVmlzaXQubWFwKGFzdCA9PiBsb2NhdGVTeW1ib2woYXN0LCBwYXRoLCBpbmZvKSlcbiAgICAgIC5maWx0ZXIoKHN5bSk6IHN5bSBpcyBTeW1ib2xJbmZvID0+IHN5bSAhPT0gdW5kZWZpbmVkKTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSB0ZW1wbGF0ZSBub2RlIGFuZCBsb2NhdGVzIHRoZSBzeW1ib2wgaW4gdGhhdCBub2RlIGF0IGEgcGF0aCBwb3NpdGlvbi5cbiAqIEBwYXJhbSBhc3QgdGVtcGxhdGUgQVNUIG5vZGUgdG8gdmlzaXRcbiAqIEBwYXJhbSBwYXRoIG5vbi1lbXB0eSBzZXQgb2YgbmFycm93aW5nIEFTVCBub2RlcyBhdCBhIHBvc2l0aW9uXG4gKiBAcGFyYW0gaW5mbyB0ZW1wbGF0ZSBBU1QgaW5mb3JtYXRpb24gc2V0XG4gKi9cbmZ1bmN0aW9uIGxvY2F0ZVN5bWJvbChhc3Q6IFRlbXBsYXRlQXN0LCBwYXRoOiBUZW1wbGF0ZUFzdFBhdGgsIGluZm86IEFzdFJlc3VsdCk6IFN5bWJvbEluZm98XG4gICAgdW5kZWZpbmVkIHtcbiAgY29uc3QgdGVtcGxhdGVQb3NpdGlvbiA9IHBhdGgucG9zaXRpb247XG4gIGNvbnN0IHBvc2l0aW9uID0gdGVtcGxhdGVQb3NpdGlvbiArIGluZm8udGVtcGxhdGUuc3Bhbi5zdGFydDtcbiAgbGV0IHN5bWJvbDogU3ltYm9sfHVuZGVmaW5lZDtcbiAgbGV0IHNwYW46IFNwYW58dW5kZWZpbmVkO1xuICBsZXQgc3RhdGljU3ltYm9sOiBTdGF0aWNTeW1ib2x8dW5kZWZpbmVkO1xuICBjb25zdCBhdHRyaWJ1dGVWYWx1ZVN5bWJvbCA9IChhc3Q6IEFTVCk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGZpbmRBdHRyaWJ1dGUoaW5mbywgcG9zaXRpb24pO1xuICAgIGlmIChhdHRyaWJ1dGUpIHtcbiAgICAgIGlmIChpblNwYW4odGVtcGxhdGVQb3NpdGlvbiwgc3Bhbk9mKGF0dHJpYnV0ZS52YWx1ZVNwYW4pKSkge1xuICAgICAgICBsZXQgcmVzdWx0OiB7c3ltYm9sOiBTeW1ib2wsIHNwYW46IFNwYW59fHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGF0dHJpYnV0ZS5uYW1lLnN0YXJ0c1dpdGgoJyonKSkge1xuICAgICAgICAgIHJlc3VsdCA9IGdldFN5bWJvbEluTWljcm9zeW50YXgoaW5mbywgcGF0aCwgYXR0cmlidXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBkaW5mbyA9IGRpYWdub3N0aWNJbmZvRnJvbVRlbXBsYXRlSW5mbyhpbmZvKTtcbiAgICAgICAgICBjb25zdCBzY29wZSA9IGdldEV4cHJlc3Npb25TY29wZShkaW5mbywgcGF0aCk7XG4gICAgICAgICAgcmVzdWx0ID0gZ2V0RXhwcmVzc2lvblN5bWJvbChzY29wZSwgYXN0LCB0ZW1wbGF0ZVBvc2l0aW9uLCBpbmZvLnRlbXBsYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgc3ltYm9sID0gcmVzdWx0LnN5bWJvbDtcbiAgICAgICAgICBzcGFuID0gb2Zmc2V0U3BhbihyZXN1bHQuc3BhbiwgYXR0cmlidXRlLnZhbHVlU3BhbiAhLnN0YXJ0Lm9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbiAgYXN0LnZpc2l0KFxuICAgICAge1xuICAgICAgICB2aXNpdE5nQ29udGVudChhc3QpIHt9LFxuICAgICAgICB2aXNpdEVtYmVkZGVkVGVtcGxhdGUoYXN0KSB7fSxcbiAgICAgICAgdmlzaXRFbGVtZW50KGFzdCkge1xuICAgICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGFzdC5kaXJlY3RpdmVzLmZpbmQoZCA9PiBkLmRpcmVjdGl2ZS5pc0NvbXBvbmVudCk7XG4gICAgICAgICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgICAgICAgLy8gTmVlZCB0byBjYXN0IGJlY2F1c2UgJ3JlZmVyZW5jZScgaXMgdHlwZWQgYXMgYW55XG4gICAgICAgICAgICBzdGF0aWNTeW1ib2wgPSBjb21wb25lbnQuZGlyZWN0aXZlLnR5cGUucmVmZXJlbmNlIGFzIFN0YXRpY1N5bWJvbDtcbiAgICAgICAgICAgIHN5bWJvbCA9IGluZm8udGVtcGxhdGUucXVlcnkuZ2V0VHlwZVN5bWJvbChzdGF0aWNTeW1ib2wpO1xuICAgICAgICAgICAgc3ltYm9sID0gc3ltYm9sICYmIG5ldyBPdmVycmlkZUtpbmRTeW1ib2woc3ltYm9sLCBEaXJlY3RpdmVLaW5kLkNPTVBPTkVOVCk7XG4gICAgICAgICAgICBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZpbmQgYSBkaXJlY3RpdmUgdGhhdCBtYXRjaGVzIHRoZSBlbGVtZW50IG5hbWVcbiAgICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGFzdC5kaXJlY3RpdmVzLmZpbmQoXG4gICAgICAgICAgICAgICAgZCA9PiBkLmRpcmVjdGl2ZS5zZWxlY3RvciAhPSBudWxsICYmIGQuZGlyZWN0aXZlLnNlbGVjdG9yLmluZGV4T2YoYXN0Lm5hbWUpID49IDApO1xuICAgICAgICAgICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgICAgICAgICAvLyBOZWVkIHRvIGNhc3QgYmVjYXVzZSAncmVmZXJlbmNlJyBpcyB0eXBlZCBhcyBhbnlcbiAgICAgICAgICAgICAgc3RhdGljU3ltYm9sID0gZGlyZWN0aXZlLmRpcmVjdGl2ZS50eXBlLnJlZmVyZW5jZSBhcyBTdGF0aWNTeW1ib2w7XG4gICAgICAgICAgICAgIHN5bWJvbCA9IGluZm8udGVtcGxhdGUucXVlcnkuZ2V0VHlwZVN5bWJvbChzdGF0aWNTeW1ib2wpO1xuICAgICAgICAgICAgICBzeW1ib2wgPSBzeW1ib2wgJiYgbmV3IE92ZXJyaWRlS2luZFN5bWJvbChzeW1ib2wsIERpcmVjdGl2ZUtpbmQuRElSRUNUSVZFKTtcbiAgICAgICAgICAgICAgc3BhbiA9IHNwYW5PZihhc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdmlzaXRSZWZlcmVuY2UoYXN0KSB7XG4gICAgICAgICAgc3ltYm9sID0gYXN0LnZhbHVlICYmIGluZm8udGVtcGxhdGUucXVlcnkuZ2V0VHlwZVN5bWJvbCh0b2tlblJlZmVyZW5jZShhc3QudmFsdWUpKTtcbiAgICAgICAgICBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICAgIH0sXG4gICAgICAgIHZpc2l0VmFyaWFibGUoYXN0KSB7fSxcbiAgICAgICAgdmlzaXRFdmVudChhc3QpIHtcbiAgICAgICAgICBpZiAoIWF0dHJpYnV0ZVZhbHVlU3ltYm9sKGFzdC5oYW5kbGVyKSkge1xuICAgICAgICAgICAgc3ltYm9sID0gZmluZE91dHB1dEJpbmRpbmcoYXN0LCBwYXRoLCBpbmZvLnRlbXBsYXRlLnF1ZXJ5KTtcbiAgICAgICAgICAgIHN5bWJvbCA9IHN5bWJvbCAmJiBuZXcgT3ZlcnJpZGVLaW5kU3ltYm9sKHN5bWJvbCwgRGlyZWN0aXZlS2luZC5FVkVOVCk7XG4gICAgICAgICAgICBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aXNpdEVsZW1lbnRQcm9wZXJ0eShhc3QpIHsgYXR0cmlidXRlVmFsdWVTeW1ib2woYXN0LnZhbHVlKTsgfSxcbiAgICAgICAgdmlzaXRBdHRyKGFzdCkge1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBwYXRoLmZpcnN0KEVsZW1lbnRBc3QpO1xuICAgICAgICAgIGlmICghZWxlbWVudCkgcmV0dXJuO1xuICAgICAgICAgIC8vIENyZWF0ZSBhIG1hcHBpbmcgb2YgYWxsIGRpcmVjdGl2ZXMgYXBwbGllZCB0byB0aGUgZWxlbWVudCBmcm9tIHRoZWlyIHNlbGVjdG9ycy5cbiAgICAgICAgICBjb25zdCBtYXRjaGVyID0gbmV3IFNlbGVjdG9yTWF0Y2hlcjxEaXJlY3RpdmVBc3Q+KCk7XG4gICAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgZWxlbWVudC5kaXJlY3RpdmVzKSB7XG4gICAgICAgICAgICBpZiAoIWRpci5kaXJlY3RpdmUuc2VsZWN0b3IpIGNvbnRpbnVlO1xuICAgICAgICAgICAgbWF0Y2hlci5hZGRTZWxlY3RhYmxlcyhDc3NTZWxlY3Rvci5wYXJzZShkaXIuZGlyZWN0aXZlLnNlbGVjdG9yKSwgZGlyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTZWUgaWYgdGhpcyBhdHRyaWJ1dGUgbWF0Y2hlcyB0aGUgc2VsZWN0b3Igb2YgYW55IGRpcmVjdGl2ZSBvbiB0aGUgZWxlbWVudC5cbiAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVTZWxlY3RvciA9IGBbJHthc3QubmFtZX09JHthc3QudmFsdWV9XWA7XG4gICAgICAgICAgY29uc3QgcGFyc2VkQXR0cmlidXRlID0gQ3NzU2VsZWN0b3IucGFyc2UoYXR0cmlidXRlU2VsZWN0b3IpO1xuICAgICAgICAgIGlmICghcGFyc2VkQXR0cmlidXRlLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICAgIG1hdGNoZXIubWF0Y2gocGFyc2VkQXR0cmlidXRlWzBdLCAoXywge2RpcmVjdGl2ZX0pID0+IHtcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gY2FzdCBiZWNhdXNlICdyZWZlcmVuY2UnIGlzIHR5cGVkIGFzIGFueVxuICAgICAgICAgICAgc3RhdGljU3ltYm9sID0gZGlyZWN0aXZlLnR5cGUucmVmZXJlbmNlIGFzIFN0YXRpY1N5bWJvbDtcbiAgICAgICAgICAgIHN5bWJvbCA9IGluZm8udGVtcGxhdGUucXVlcnkuZ2V0VHlwZVN5bWJvbChzdGF0aWNTeW1ib2wpO1xuICAgICAgICAgICAgc3ltYm9sID0gc3ltYm9sICYmIG5ldyBPdmVycmlkZUtpbmRTeW1ib2woc3ltYm9sLCBEaXJlY3RpdmVLaW5kLkRJUkVDVElWRSk7XG4gICAgICAgICAgICBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHZpc2l0Qm91bmRUZXh0KGFzdCkge1xuICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25Qb3NpdGlvbiA9IHRlbXBsYXRlUG9zaXRpb24gLSBhc3Quc291cmNlU3Bhbi5zdGFydC5vZmZzZXQ7XG4gICAgICAgICAgaWYgKGluU3BhbihleHByZXNzaW9uUG9zaXRpb24sIGFzdC52YWx1ZS5zcGFuKSkge1xuICAgICAgICAgICAgY29uc3QgZGluZm8gPSBkaWFnbm9zdGljSW5mb0Zyb21UZW1wbGF0ZUluZm8oaW5mbyk7XG4gICAgICAgICAgICBjb25zdCBzY29wZSA9IGdldEV4cHJlc3Npb25TY29wZShkaW5mbywgcGF0aCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBnZXRFeHByZXNzaW9uU3ltYm9sKHNjb3BlLCBhc3QudmFsdWUsIHRlbXBsYXRlUG9zaXRpb24sIGluZm8udGVtcGxhdGUpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICBzeW1ib2wgPSByZXN1bHQuc3ltYm9sO1xuICAgICAgICAgICAgICBzcGFuID0gb2Zmc2V0U3BhbihyZXN1bHQuc3BhbiwgYXN0LnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHZpc2l0VGV4dChhc3QpIHt9LFxuICAgICAgICB2aXNpdERpcmVjdGl2ZShhc3QpIHtcbiAgICAgICAgICAvLyBOZWVkIHRvIGNhc3QgYmVjYXVzZSAncmVmZXJlbmNlJyBpcyB0eXBlZCBhcyBhbnlcbiAgICAgICAgICBzdGF0aWNTeW1ib2wgPSBhc3QuZGlyZWN0aXZlLnR5cGUucmVmZXJlbmNlIGFzIFN0YXRpY1N5bWJvbDtcbiAgICAgICAgICBzeW1ib2wgPSBpbmZvLnRlbXBsYXRlLnF1ZXJ5LmdldFR5cGVTeW1ib2woc3RhdGljU3ltYm9sKTtcbiAgICAgICAgICBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICAgIH0sXG4gICAgICAgIHZpc2l0RGlyZWN0aXZlUHJvcGVydHkoYXN0KSB7XG4gICAgICAgICAgaWYgKCFhdHRyaWJ1dGVWYWx1ZVN5bWJvbChhc3QudmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSBmaW5kUGFyZW50T2ZCaW5kaW5nKGluZm8udGVtcGxhdGVBc3QsIGFzdCwgdGVtcGxhdGVQb3NpdGlvbik7XG4gICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBmaW5kQXR0cmlidXRlKGluZm8sIHBvc2l0aW9uKTtcbiAgICAgICAgICAgIGlmIChkaXJlY3RpdmUgJiYgYXR0cmlidXRlKSB7XG4gICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUubmFtZS5zdGFydHNXaXRoKCcqJykpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb21waWxlVHlwZVN1bW1hcnkgPSBkaXJlY3RpdmUuZGlyZWN0aXZlO1xuICAgICAgICAgICAgICAgIHN5bWJvbCA9IGluZm8udGVtcGxhdGUucXVlcnkuZ2V0VHlwZVN5bWJvbChjb21waWxlVHlwZVN1bW1hcnkudHlwZS5yZWZlcmVuY2UpO1xuICAgICAgICAgICAgICAgIHN5bWJvbCA9IHN5bWJvbCAmJiBuZXcgT3ZlcnJpZGVLaW5kU3ltYm9sKHN5bWJvbCwgRGlyZWN0aXZlS2luZC5ESVJFQ1RJVkUpO1xuICAgICAgICAgICAgICAgIC8vIFVzZSAnYXR0cmlidXRlLnNvdXJjZVNwYW4nIGluc3RlYWQgb2YgdGhlIGRpcmVjdGl2ZSdzLFxuICAgICAgICAgICAgICAgIC8vIGJlY2F1c2UgdGhlIHNwYW4gb2YgdGhlIGRpcmVjdGl2ZSBpcyB0aGUgd2hvbGUgb3BlbmluZyB0YWcgb2YgYW4gZWxlbWVudC5cbiAgICAgICAgICAgICAgICBzcGFuID0gc3Bhbk9mKGF0dHJpYnV0ZS5zb3VyY2VTcGFuKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzeW1ib2wgPSBmaW5kSW5wdXRCaW5kaW5nKGluZm8sIGFzdC50ZW1wbGF0ZU5hbWUsIGRpcmVjdGl2ZSk7XG4gICAgICAgICAgICAgICAgc3BhbiA9IHNwYW5PZihhc3QpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgbnVsbCk7XG4gIGlmIChzeW1ib2wgJiYgc3Bhbikge1xuICAgIGNvbnN0IHtzdGFydCwgZW5kfSA9IG9mZnNldFNwYW4oc3BhbiwgaW5mby50ZW1wbGF0ZS5zcGFuLnN0YXJ0KTtcbiAgICByZXR1cm4ge1xuICAgICAgc3ltYm9sLFxuICAgICAgc3BhbjogdHNzLmNyZWF0ZVRleHRTcGFuRnJvbUJvdW5kcyhzdGFydCwgZW5kKSwgc3RhdGljU3ltYm9sLFxuICAgIH07XG4gIH1cbn1cblxuLy8gR2V0IHRoZSBzeW1ib2wgaW4gbWljcm9zeW50YXggYXQgdGVtcGxhdGUgcG9zaXRpb24uXG5mdW5jdGlvbiBnZXRTeW1ib2xJbk1pY3Jvc3ludGF4KGluZm86IEFzdFJlc3VsdCwgcGF0aDogVGVtcGxhdGVBc3RQYXRoLCBhdHRyaWJ1dGU6IEF0dHJpYnV0ZSk6XG4gICAge3N5bWJvbDogU3ltYm9sLCBzcGFuOiBTcGFufXx1bmRlZmluZWQge1xuICBpZiAoIWF0dHJpYnV0ZS52YWx1ZVNwYW4pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgYWJzVmFsdWVPZmZzZXQgPSBhdHRyaWJ1dGUudmFsdWVTcGFuLnN0YXJ0Lm9mZnNldDtcbiAgbGV0IHJlc3VsdDoge3N5bWJvbDogU3ltYm9sLCBzcGFuOiBTcGFufXx1bmRlZmluZWQ7XG4gIGNvbnN0IHt0ZW1wbGF0ZUJpbmRpbmdzfSA9IGluZm8uZXhwcmVzc2lvblBhcnNlci5wYXJzZVRlbXBsYXRlQmluZGluZ3MoXG4gICAgICBhdHRyaWJ1dGUubmFtZSwgYXR0cmlidXRlLnZhbHVlLCBhdHRyaWJ1dGUuc291cmNlU3Bhbi50b1N0cmluZygpLFxuICAgICAgYXR0cmlidXRlLnNvdXJjZVNwYW4uc3RhcnQub2Zmc2V0LCBhdHRyaWJ1dGUudmFsdWVTcGFuLnN0YXJ0Lm9mZnNldCk7XG5cbiAgLy8gRmluZCB0aGUgc3ltYm9sIHRoYXQgY29udGFpbnMgdGhlIHBvc2l0aW9uLlxuICBmb3IgKGNvbnN0IHRiIG9mIHRlbXBsYXRlQmluZGluZ3MpIHtcbiAgICBpZiAodGIgaW5zdGFuY2VvZiBWYXJpYWJsZUJpbmRpbmcpIHtcbiAgICAgIC8vIFRPRE8oa3lsaWF1KTogaWYgYmluZGluZyBpcyB2YXJpYWJsZSB3ZSBzaG91bGQgc3RpbGwgbG9vayBmb3IgdGhlIHZhbHVlXG4gICAgICAvLyBvZiB0aGUga2V5LiBGb3IgZXhhbXBsZSwgXCJsZXQgaT1pbmRleFwiID0+IFwiaW5kZXhcIiBzaG91bGQgcG9pbnQgdG9cbiAgICAgIC8vIE5nRm9yT2ZDb250ZXh0LmluZGV4XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGluU3BhbihwYXRoLnBvc2l0aW9uLCB0Yi52YWx1ZT8uYXN0LnNvdXJjZVNwYW4pKSB7XG4gICAgICBjb25zdCBkaW5mbyA9IGRpYWdub3N0aWNJbmZvRnJvbVRlbXBsYXRlSW5mbyhpbmZvKTtcbiAgICAgIGNvbnN0IHNjb3BlID0gZ2V0RXhwcmVzc2lvblNjb3BlKGRpbmZvLCBwYXRoKTtcbiAgICAgIHJlc3VsdCA9IGdldEV4cHJlc3Npb25TeW1ib2woc2NvcGUsIHRiLnZhbHVlICEsIHBhdGgucG9zaXRpb24sIGluZm8udGVtcGxhdGUpO1xuICAgIH0gZWxzZSBpZiAoaW5TcGFuKHBhdGgucG9zaXRpb24sIHRiLnNvdXJjZVNwYW4pKSB7XG4gICAgICBjb25zdCB0ZW1wbGF0ZSA9IHBhdGguZmlyc3QoRW1iZWRkZWRUZW1wbGF0ZUFzdCk7XG4gICAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgICAgLy8gT25lIGVsZW1lbnQgY2FuIG9ubHkgaGF2ZSBvbmUgdGVtcGxhdGUgYmluZGluZy5cbiAgICAgICAgY29uc3QgZGlyZWN0aXZlQXN0ID0gdGVtcGxhdGUuZGlyZWN0aXZlc1swXTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZUFzdCkge1xuICAgICAgICAgIGNvbnN0IHN5bWJvbCA9IGZpbmRJbnB1dEJpbmRpbmcoaW5mbywgdGIua2V5LnNvdXJjZS5zdWJzdHJpbmcoMSksIGRpcmVjdGl2ZUFzdCk7XG4gICAgICAgICAgaWYgKHN5bWJvbCkge1xuICAgICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICBzeW1ib2wsXG4gICAgICAgICAgICAgIC8vIHRoZSBzcGFuIGhlcmUgaGFzIHRvIGJlIHJlbGF0aXZlIHRvIHRoZSBzdGFydCBvZiB0aGUgdGVtcGxhdGVcbiAgICAgICAgICAgICAgLy8gdmFsdWUgc28gZGVkdWN0IHRoZSBhYnNvbHV0ZSBvZmZzZXQuXG4gICAgICAgICAgICAgIC8vIFRPRE8oa3lsaWF1KTogVXNlIGFic29sdXRlIHNvdXJjZSBzcGFuIHRocm91Z2hvdXQgY29tcGxldGlvbnMuXG4gICAgICAgICAgICAgIHNwYW46IG9mZnNldFNwYW4odGIua2V5LnNwYW4sIC1hYnNWYWx1ZU9mZnNldCksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBmaW5kQXR0cmlidXRlKGluZm86IEFzdFJlc3VsdCwgcG9zaXRpb246IG51bWJlcik6IEF0dHJpYnV0ZXx1bmRlZmluZWQge1xuICBjb25zdCB0ZW1wbGF0ZVBvc2l0aW9uID0gcG9zaXRpb24gLSBpbmZvLnRlbXBsYXRlLnNwYW4uc3RhcnQ7XG4gIGNvbnN0IHBhdGggPSBnZXRQYXRoVG9Ob2RlQXRQb3NpdGlvbihpbmZvLmh0bWxBc3QsIHRlbXBsYXRlUG9zaXRpb24pO1xuICByZXR1cm4gcGF0aC5maXJzdChBdHRyaWJ1dGUpO1xufVxuXG4vLyBUT0RPOiByZW1vdmUgdGhpcyBmdW5jdGlvbiBhZnRlciB0aGUgcGF0aCBpbmNsdWRlcyAnRGlyZWN0aXZlQXN0Jy5cbi8vIEZpbmQgdGhlIGRpcmVjdGl2ZSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBzcGVjaWZpZWQgJ2JpbmRpbmcnXG4vLyBhdCB0aGUgc3BlY2lmaWVkICdwb3NpdGlvbicgaW4gdGhlICdhc3QnLlxuZnVuY3Rpb24gZmluZFBhcmVudE9mQmluZGluZyhcbiAgICBhc3Q6IFRlbXBsYXRlQXN0W10sIGJpbmRpbmc6IEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3QsIHBvc2l0aW9uOiBudW1iZXIpOiBEaXJlY3RpdmVBc3R8XG4gICAgdW5kZWZpbmVkIHtcbiAgbGV0IHJlczogRGlyZWN0aXZlQXN0fHVuZGVmaW5lZDtcbiAgY29uc3QgdmlzaXRvciA9IG5ldyBjbGFzcyBleHRlbmRzIFJlY3Vyc2l2ZVRlbXBsYXRlQXN0VmlzaXRvciB7XG4gICAgdmlzaXQoYXN0OiBUZW1wbGF0ZUFzdCk6IGFueSB7XG4gICAgICBjb25zdCBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICBpZiAoIWluU3Bhbihwb3NpdGlvbiwgc3BhbikpIHtcbiAgICAgICAgLy8gUmV0dXJuaW5nIGEgdmFsdWUgaGVyZSB3aWxsIHJlc3VsdCBpbiB0aGUgY2hpbGRyZW4gYmVpbmcgc2tpcHBlZC5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmlzaXRFbWJlZGRlZFRlbXBsYXRlKGFzdDogRW1iZWRkZWRUZW1wbGF0ZUFzdCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICAgIHJldHVybiB0aGlzLnZpc2l0Q2hpbGRyZW4oY29udGV4dCwgdmlzaXQgPT4ge1xuICAgICAgICB2aXNpdChhc3QuZGlyZWN0aXZlcyk7XG4gICAgICAgIHZpc2l0KGFzdC5jaGlsZHJlbik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2aXNpdEVsZW1lbnQoYXN0OiBFbGVtZW50QXN0LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgICAgcmV0dXJuIHRoaXMudmlzaXRDaGlsZHJlbihjb250ZXh0LCB2aXNpdCA9PiB7XG4gICAgICAgIHZpc2l0KGFzdC5kaXJlY3RpdmVzKTtcbiAgICAgICAgdmlzaXQoYXN0LmNoaWxkcmVuKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZpc2l0RGlyZWN0aXZlKGFzdDogRGlyZWN0aXZlQXN0KSB7XG4gICAgICBjb25zdCByZXN1bHQgPSB0aGlzLnZpc2l0Q2hpbGRyZW4oYXN0LCB2aXNpdCA9PiB7IHZpc2l0KGFzdC5pbnB1dHMpOyB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgdmlzaXREaXJlY3RpdmVQcm9wZXJ0eShhc3Q6IEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3QsIGNvbnRleHQ6IERpcmVjdGl2ZUFzdCkge1xuICAgICAgaWYgKGFzdCA9PT0gYmluZGluZykge1xuICAgICAgICByZXMgPSBjb250ZXh0O1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgdGVtcGxhdGVWaXNpdEFsbCh2aXNpdG9yLCBhc3QpO1xuICByZXR1cm4gcmVzO1xufVxuXG4vLyBGaW5kIHRoZSBzeW1ib2wgb2YgaW5wdXQgYmluZGluZyBpbiAnZGlyZWN0aXZlQXN0JyBieSAnbmFtZScuXG5mdW5jdGlvbiBmaW5kSW5wdXRCaW5kaW5nKGluZm86IEFzdFJlc3VsdCwgbmFtZTogc3RyaW5nLCBkaXJlY3RpdmVBc3Q6IERpcmVjdGl2ZUFzdCk6IFN5bWJvbHxcbiAgICB1bmRlZmluZWQge1xuICBjb25zdCBpbnZlcnRlZElucHV0ID0gaW52ZXJ0TWFwKGRpcmVjdGl2ZUFzdC5kaXJlY3RpdmUuaW5wdXRzKTtcbiAgY29uc3QgZmllbGROYW1lID0gaW52ZXJ0ZWRJbnB1dFtuYW1lXTtcbiAgaWYgKGZpZWxkTmFtZSkge1xuICAgIGNvbnN0IGNsYXNzU3ltYm9sID0gaW5mby50ZW1wbGF0ZS5xdWVyeS5nZXRUeXBlU3ltYm9sKGRpcmVjdGl2ZUFzdC5kaXJlY3RpdmUudHlwZS5yZWZlcmVuY2UpO1xuICAgIGlmIChjbGFzc1N5bWJvbCkge1xuICAgICAgcmV0dXJuIGNsYXNzU3ltYm9sLm1lbWJlcnMoKS5nZXQoZmllbGROYW1lKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwIGEgc3ltYm9sIGFuZCBjaGFuZ2UgaXRzIGtpbmQgdG8gY29tcG9uZW50LlxuICovXG5jbGFzcyBPdmVycmlkZUtpbmRTeW1ib2wgaW1wbGVtZW50cyBTeW1ib2wge1xuICBwdWJsaWMgcmVhZG9ubHkga2luZDogRGlyZWN0aXZlS2luZDtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzeW06IFN5bWJvbCwga2luZE92ZXJyaWRlOiBEaXJlY3RpdmVLaW5kKSB7IHRoaXMua2luZCA9IGtpbmRPdmVycmlkZTsgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnN5bS5uYW1lOyB9XG5cbiAgZ2V0IGxhbmd1YWdlKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnN5bS5sYW5ndWFnZTsgfVxuXG4gIGdldCB0eXBlKCk6IFN5bWJvbHx1bmRlZmluZWQgeyByZXR1cm4gdGhpcy5zeW0udHlwZTsgfVxuXG4gIGdldCBjb250YWluZXIoKTogU3ltYm9sfHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLnN5bS5jb250YWluZXI7IH1cblxuICBnZXQgcHVibGljKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5zeW0ucHVibGljOyB9XG5cbiAgZ2V0IGNhbGxhYmxlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5zeW0uY2FsbGFibGU7IH1cblxuICBnZXQgbnVsbGFibGUoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnN5bS5udWxsYWJsZTsgfVxuXG4gIGdldCBkZWZpbml0aW9uKCk6IERlZmluaXRpb24geyByZXR1cm4gdGhpcy5zeW0uZGVmaW5pdGlvbjsgfVxuXG4gIGdldCBkb2N1bWVudGF0aW9uKCk6IHRzLlN5bWJvbERpc3BsYXlQYXJ0W10geyByZXR1cm4gdGhpcy5zeW0uZG9jdW1lbnRhdGlvbjsgfVxuXG4gIG1lbWJlcnMoKSB7IHJldHVybiB0aGlzLnN5bS5tZW1iZXJzKCk7IH1cblxuICBzaWduYXR1cmVzKCkgeyByZXR1cm4gdGhpcy5zeW0uc2lnbmF0dXJlcygpOyB9XG5cbiAgc2VsZWN0U2lnbmF0dXJlKHR5cGVzOiBTeW1ib2xbXSkgeyByZXR1cm4gdGhpcy5zeW0uc2VsZWN0U2lnbmF0dXJlKHR5cGVzKTsgfVxuXG4gIGluZGV4ZWQoYXJndW1lbnQ6IFN5bWJvbCkgeyByZXR1cm4gdGhpcy5zeW0uaW5kZXhlZChhcmd1bWVudCk7IH1cblxuICB0eXBlQXJndW1lbnRzKCk6IFN5bWJvbFtdfHVuZGVmaW5lZCB7IHJldHVybiB0aGlzLnN5bS50eXBlQXJndW1lbnRzKCk7IH1cbn1cbiJdfQ==