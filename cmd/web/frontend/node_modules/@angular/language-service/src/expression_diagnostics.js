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
        define("@angular/language-service/src/expression_diagnostics", ["require", "exports", "tslib", "@angular/compiler", "@angular/language-service/src/diagnostic_messages", "@angular/language-service/src/expression_type", "@angular/language-service/src/symbols", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var diagnostic_messages_1 = require("@angular/language-service/src/diagnostic_messages");
    var expression_type_1 = require("@angular/language-service/src/expression_type");
    var symbols_1 = require("@angular/language-service/src/symbols");
    var utils_1 = require("@angular/language-service/src/utils");
    function getTemplateExpressionDiagnostics(info) {
        var visitor = new ExpressionDiagnosticsVisitor(info, function (path) { return getExpressionScope(info, path); });
        compiler_1.templateVisitAll(visitor, info.templateAst);
        return visitor.diagnostics;
    }
    exports.getTemplateExpressionDiagnostics = getTemplateExpressionDiagnostics;
    function getReferences(info) {
        var result = [];
        function processReferences(references) {
            var e_1, _a;
            var _loop_1 = function (reference) {
                var type = undefined;
                if (reference.value) {
                    type = info.query.getTypeSymbol(compiler_1.tokenReference(reference.value));
                }
                result.push({
                    name: reference.name,
                    kind: 'reference',
                    type: type || info.query.getBuiltinType(symbols_1.BuiltinType.Any),
                    get definition() { return getDefinitionOf(info, reference); }
                });
            };
            try {
                for (var references_1 = tslib_1.__values(references), references_1_1 = references_1.next(); !references_1_1.done; references_1_1 = references_1.next()) {
                    var reference = references_1_1.value;
                    _loop_1(reference);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (references_1_1 && !references_1_1.done && (_a = references_1.return)) _a.call(references_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        var visitor = new /** @class */ (function (_super) {
            tslib_1.__extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.visitEmbeddedTemplate = function (ast, context) {
                _super.prototype.visitEmbeddedTemplate.call(this, ast, context);
                processReferences(ast.references);
            };
            class_1.prototype.visitElement = function (ast, context) {
                _super.prototype.visitElement.call(this, ast, context);
                processReferences(ast.references);
            };
            return class_1;
        }(compiler_1.RecursiveTemplateAstVisitor));
        compiler_1.templateVisitAll(visitor, info.templateAst);
        return result;
    }
    function getDefinitionOf(info, ast) {
        if (info.fileName) {
            var templateOffset = info.offset;
            return [{
                    fileName: info.fileName,
                    span: {
                        start: ast.sourceSpan.start.offset + templateOffset,
                        end: ast.sourceSpan.end.offset + templateOffset
                    }
                }];
        }
    }
    /**
     * Resolve all variable declarations in a template by traversing the specified
     * `path`.
     * @param info
     * @param path template AST path
     */
    function getVarDeclarations(info, path) {
        var e_2, _a;
        var results = [];
        for (var current = path.head; current; current = path.childOf(current)) {
            if (!(current instanceof compiler_1.EmbeddedTemplateAst)) {
                continue;
            }
            var _loop_2 = function (variable) {
                var symbol = getVariableTypeFromDirectiveContext(variable.value, info.query, current);
                var kind = info.query.getTypeKind(symbol);
                if (kind === symbols_1.BuiltinType.Any || kind === symbols_1.BuiltinType.Unbound) {
                    // For special cases such as ngFor and ngIf, the any type is not very useful.
                    // We can do better by resolving the binding value.
                    var symbolsInScope = info.query.mergeSymbolTable([
                        info.members,
                        // Since we are traversing the AST path from head to tail, any variables
                        // that have been declared so far are also in scope.
                        info.query.createSymbolTable(results),
                    ]);
                    symbol = refinedVariableType(variable.value, symbolsInScope, info, current);
                }
                results.push({
                    name: variable.name,
                    kind: 'variable',
                    type: symbol, get definition() { return getDefinitionOf(info, variable); },
                });
            };
            try {
                for (var _b = (e_2 = void 0, tslib_1.__values(current.variables)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var variable = _c.value;
                    _loop_2(variable);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        return results;
    }
    /**
     * Resolve the type for the variable in `templateElement` by finding the structural
     * directive which has the context member. Returns any when not found.
     * @param value variable value name
     * @param query type symbol query
     * @param templateElement
     */
    function getVariableTypeFromDirectiveContext(value, query, templateElement) {
        var e_3, _a;
        try {
            for (var _b = tslib_1.__values(templateElement.directives), _c = _b.next(); !_c.done; _c = _b.next()) {
                var directive = _c.value.directive;
                var context = query.getTemplateContext(directive.type.reference);
                if (context) {
                    var member = context.get(value);
                    if (member && member.type) {
                        return member.type;
                    }
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
        return query.getBuiltinType(symbols_1.BuiltinType.Any);
    }
    /**
     * Resolve a more specific type for the variable in `templateElement` by inspecting
     * all variables that are in scope in the `mergedTable`. This function is a special
     * case for `ngFor` and `ngIf`. If resolution fails, return the `any` type.
     * @param value variable value name
     * @param mergedTable symbol table for all variables in scope
     * @param info available template information
     * @param templateElement
     */
    function refinedVariableType(value, mergedTable, info, templateElement) {
        if (value === '$implicit') {
            // Special case: ngFor directive
            var ngForDirective = templateElement.directives.find(function (d) {
                var name = compiler_1.identifierName(d.directive.type);
                return name == 'NgFor' || name == 'NgForOf';
            });
            if (ngForDirective) {
                var ngForOfBinding = ngForDirective.inputs.find(function (i) { return i.directiveName == 'ngForOf'; });
                if (ngForOfBinding) {
                    // Check if there is a known type for the ngFor binding.
                    var bindingType = new expression_type_1.AstType(mergedTable, info.query, {}, info.source).getType(ngForOfBinding.value);
                    if (bindingType) {
                        var result = info.query.getElementType(bindingType);
                        if (result) {
                            return result;
                        }
                    }
                }
            }
        }
        if (value === 'ngIf' || value === '$implicit') {
            var ngIfDirective = templateElement.directives.find(function (d) { return compiler_1.identifierName(d.directive.type) === 'NgIf'; });
            if (ngIfDirective) {
                // Special case: ngIf directive. The NgIf structural directive owns a template context with
                // "$implicit" and "ngIf" members. These properties are typed as generics. Until the language
                // service uses an Ivy and TypecheckBlock backend, we cannot bind these values to a concrete
                // type without manual inference. To get the concrete type, look up the type of the "ngIf"
                // import on the NgIf directive bound to the template.
                //
                // See @angular/common/ng_if.ts for more information.
                var ngIfBinding = ngIfDirective.inputs.find(function (i) { return i.directiveName === 'ngIf'; });
                if (ngIfBinding) {
                    // Check if there is a known type bound to the ngIf input.
                    var bindingType = new expression_type_1.AstType(mergedTable, info.query, {}, info.source).getType(ngIfBinding.value);
                    if (bindingType) {
                        return bindingType;
                    }
                }
            }
        }
        // We can't do better, return any
        return info.query.getBuiltinType(symbols_1.BuiltinType.Any);
    }
    function getEventDeclaration(info, path) {
        var event = path.tail;
        if (!(event instanceof compiler_1.BoundEventAst)) {
            // No event available in this context.
            return;
        }
        var genericEvent = {
            name: '$event',
            kind: 'variable',
            type: info.query.getBuiltinType(symbols_1.BuiltinType.Any),
        };
        var outputSymbol = utils_1.findOutputBinding(event, path, info.query);
        if (!outputSymbol) {
            // The `$event` variable doesn't belong to an output, so its type can't be refined.
            // TODO: type `$event` variables in bindings to DOM events.
            return genericEvent;
        }
        // The raw event type is wrapped in a generic, like EventEmitter<T> or Observable<T>.
        var ta = outputSymbol.typeArguments();
        if (!ta || ta.length !== 1)
            return genericEvent;
        var eventType = ta[0];
        return tslib_1.__assign(tslib_1.__assign({}, genericEvent), { type: eventType });
    }
    /**
     * Returns the symbols available in a particular scope of a template.
     * @param info parsed template information
     * @param path path of template nodes narrowing to the context the expression scope should be
     * derived for.
     */
    function getExpressionScope(info, path) {
        var result = info.members;
        var references = getReferences(info);
        var variables = getVarDeclarations(info, path);
        var event = getEventDeclaration(info, path);
        if (references.length || variables.length || event) {
            var referenceTable = info.query.createSymbolTable(references);
            var variableTable = info.query.createSymbolTable(variables);
            var eventsTable = info.query.createSymbolTable(event ? [event] : []);
            result = info.query.mergeSymbolTable([result, referenceTable, variableTable, eventsTable]);
        }
        return result;
    }
    exports.getExpressionScope = getExpressionScope;
    var ExpressionDiagnosticsVisitor = /** @class */ (function (_super) {
        tslib_1.__extends(ExpressionDiagnosticsVisitor, _super);
        function ExpressionDiagnosticsVisitor(info, getExpressionScope) {
            var _this = _super.call(this) || this;
            _this.info = info;
            _this.getExpressionScope = getExpressionScope;
            _this.diagnostics = [];
            _this.path = new compiler_1.AstPath([]);
            return _this;
        }
        ExpressionDiagnosticsVisitor.prototype.visitDirective = function (ast, context) {
            // Override the default child visitor to ignore the host properties of a directive.
            if (ast.inputs && ast.inputs.length) {
                compiler_1.templateVisitAll(this, ast.inputs, context);
            }
        };
        ExpressionDiagnosticsVisitor.prototype.visitBoundText = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.value, ast.sourceSpan.start.offset, false);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitDirectiveProperty = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.value, this.attributeValueLocation(ast), false);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitElementProperty = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.value, this.attributeValueLocation(ast), false);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitEvent = function (ast) {
            this.push(ast);
            this.diagnoseExpression(ast.handler, this.attributeValueLocation(ast), true);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitVariable = function (ast) {
            var directive = this.directiveSummary;
            if (directive && ast.value) {
                var context = this.info.query.getTemplateContext(directive.type.reference);
                if (context && !context.has(ast.value)) {
                    var missingMember = ast.value === '$implicit' ? 'an implicit value' : "a member called '" + ast.value + "'";
                    var span = this.absSpan(spanOf(ast.sourceSpan));
                    this.diagnostics.push(diagnostic_messages_1.createDiagnostic(span, diagnostic_messages_1.Diagnostic.template_context_missing_member, directive.type.reference.name, missingMember));
                }
            }
        };
        ExpressionDiagnosticsVisitor.prototype.visitElement = function (ast, context) {
            this.push(ast);
            _super.prototype.visitElement.call(this, ast, context);
            this.pop();
        };
        ExpressionDiagnosticsVisitor.prototype.visitEmbeddedTemplate = function (ast, context) {
            var previousDirectiveSummary = this.directiveSummary;
            this.push(ast);
            // Find directive that references this template
            this.directiveSummary =
                ast.directives.map(function (d) { return d.directive; }).find(function (d) { return hasTemplateReference(d.type); });
            // Process children
            _super.prototype.visitEmbeddedTemplate.call(this, ast, context);
            this.pop();
            this.directiveSummary = previousDirectiveSummary;
        };
        ExpressionDiagnosticsVisitor.prototype.attributeValueLocation = function (ast) {
            var path = utils_1.getPathToNodeAtPosition(this.info.htmlAst, ast.sourceSpan.start.offset);
            var last = path.tail;
            if (last instanceof compiler_1.Attribute && last.valueSpan) {
                return last.valueSpan.start.offset;
            }
            return ast.sourceSpan.start.offset;
        };
        ExpressionDiagnosticsVisitor.prototype.diagnoseExpression = function (ast, offset, inEvent) {
            var e_4, _a;
            var scope = this.getExpressionScope(this.path, inEvent);
            var analyzer = new expression_type_1.AstType(scope, this.info.query, { inEvent: inEvent }, this.info.source);
            try {
                for (var _b = tslib_1.__values(analyzer.getDiagnostics(ast)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var diagnostic = _c.value;
                    diagnostic.span = this.absSpan(diagnostic.span, offset);
                    this.diagnostics.push(diagnostic);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
        };
        ExpressionDiagnosticsVisitor.prototype.push = function (ast) { this.path.push(ast); };
        ExpressionDiagnosticsVisitor.prototype.pop = function () { this.path.pop(); };
        ExpressionDiagnosticsVisitor.prototype.absSpan = function (span, additionalOffset) {
            if (additionalOffset === void 0) { additionalOffset = 0; }
            return {
                start: span.start + this.info.offset + additionalOffset,
                end: span.end + this.info.offset + additionalOffset,
            };
        };
        return ExpressionDiagnosticsVisitor;
    }(compiler_1.RecursiveTemplateAstVisitor));
    function hasTemplateReference(type) {
        var e_5, _a;
        if (type.diDeps) {
            try {
                for (var _b = tslib_1.__values(type.diDeps), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var diDep = _c.value;
                    if (diDep.token && diDep.token.identifier &&
                        compiler_1.identifierName(diDep.token.identifier) == 'TemplateRef')
                        return true;
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
        }
        return false;
    }
    function spanOf(sourceSpan) {
        return { start: sourceSpan.start.offset, end: sourceSpan.end.offset };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbl9kaWFnbm9zdGljcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2xhbmd1YWdlLXNlcnZpY2Uvc3JjL2V4cHJlc3Npb25fZGlhZ25vc3RpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7O0lBRUgsOENBQXVZO0lBRXZZLHlGQUFtRTtJQUNuRSxpRkFBMEM7SUFDMUMsaUVBQTZHO0lBRTdHLDZEQUFtRTtJQVluRSxTQUFnQixnQ0FBZ0MsQ0FBQyxJQUE0QjtRQUMzRSxJQUFNLE9BQU8sR0FBRyxJQUFJLDRCQUE0QixDQUM1QyxJQUFJLEVBQUUsVUFBQyxJQUFxQixJQUFLLE9BQUEsa0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUE5QixDQUE4QixDQUFDLENBQUM7UUFDckUsMkJBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM1QyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUM7SUFDN0IsQ0FBQztJQUxELDRFQUtDO0lBRUQsU0FBUyxhQUFhLENBQUMsSUFBNEI7UUFDakQsSUFBTSxNQUFNLEdBQXdCLEVBQUUsQ0FBQztRQUV2QyxTQUFTLGlCQUFpQixDQUFDLFVBQTBCOztvQ0FDeEMsU0FBUztnQkFDbEIsSUFBSSxJQUFJLEdBQXFCLFNBQVMsQ0FBQztnQkFDdkMsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFO29CQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMseUJBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDbEU7Z0JBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7b0JBQ3BCLElBQUksRUFBRSxXQUFXO29CQUNqQixJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FB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QyxDQUFDO0lBQ3RFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVNULCBBc3RQYXRoLCBBdHRyaWJ1dGUsIEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3QsIEJvdW5kRWxlbWVudFByb3BlcnR5QXN0LCBCb3VuZEV2ZW50QXN0LCBCb3VuZFRleHRBc3QsIENvbXBpbGVEaXJlY3RpdmVTdW1tYXJ5LCBDb21waWxlVHlwZU1ldGFkYXRhLCBEaXJlY3RpdmVBc3QsIEVsZW1lbnRBc3QsIEVtYmVkZGVkVGVtcGxhdGVBc3QsIE5vZGUsIFBhcnNlU291cmNlU3BhbiwgUmVjdXJzaXZlVGVtcGxhdGVBc3RWaXNpdG9yLCBSZWZlcmVuY2VBc3QsIFRlbXBsYXRlQXN0LCBUZW1wbGF0ZUFzdFBhdGgsIFZhcmlhYmxlQXN0LCBpZGVudGlmaWVyTmFtZSwgdGVtcGxhdGVWaXNpdEFsbCwgdG9rZW5SZWZlcmVuY2V9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtEaWFnbm9zdGljLCBjcmVhdGVEaWFnbm9zdGljfSBmcm9tICcuL2RpYWdub3N0aWNfbWVzc2FnZXMnO1xuaW1wb3J0IHtBc3RUeXBlfSBmcm9tICcuL2V4cHJlc3Npb25fdHlwZSc7XG5pbXBvcnQge0J1aWx0aW5UeXBlLCBEZWZpbml0aW9uLCBTcGFuLCBTeW1ib2wsIFN5bWJvbERlY2xhcmF0aW9uLCBTeW1ib2xRdWVyeSwgU3ltYm9sVGFibGV9IGZyb20gJy4vc3ltYm9scyc7XG5pbXBvcnQgKiBhcyBuZyBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7ZmluZE91dHB1dEJpbmRpbmcsIGdldFBhdGhUb05vZGVBdFBvc2l0aW9ufSBmcm9tICcuL3V0aWxzJztcblxuZXhwb3J0IGludGVyZmFjZSBEaWFnbm9zdGljVGVtcGxhdGVJbmZvIHtcbiAgZmlsZU5hbWU/OiBzdHJpbmc7XG4gIG9mZnNldDogbnVtYmVyO1xuICBxdWVyeTogU3ltYm9sUXVlcnk7XG4gIG1lbWJlcnM6IFN5bWJvbFRhYmxlO1xuICBodG1sQXN0OiBOb2RlW107XG4gIHRlbXBsYXRlQXN0OiBUZW1wbGF0ZUFzdFtdO1xuICBzb3VyY2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRlbXBsYXRlRXhwcmVzc2lvbkRpYWdub3N0aWNzKGluZm86IERpYWdub3N0aWNUZW1wbGF0ZUluZm8pOiBuZy5EaWFnbm9zdGljW10ge1xuICBjb25zdCB2aXNpdG9yID0gbmV3IEV4cHJlc3Npb25EaWFnbm9zdGljc1Zpc2l0b3IoXG4gICAgICBpbmZvLCAocGF0aDogVGVtcGxhdGVBc3RQYXRoKSA9PiBnZXRFeHByZXNzaW9uU2NvcGUoaW5mbywgcGF0aCkpO1xuICB0ZW1wbGF0ZVZpc2l0QWxsKHZpc2l0b3IsIGluZm8udGVtcGxhdGVBc3QpO1xuICByZXR1cm4gdmlzaXRvci5kaWFnbm9zdGljcztcbn1cblxuZnVuY3Rpb24gZ2V0UmVmZXJlbmNlcyhpbmZvOiBEaWFnbm9zdGljVGVtcGxhdGVJbmZvKTogU3ltYm9sRGVjbGFyYXRpb25bXSB7XG4gIGNvbnN0IHJlc3VsdDogU3ltYm9sRGVjbGFyYXRpb25bXSA9IFtdO1xuXG4gIGZ1bmN0aW9uIHByb2Nlc3NSZWZlcmVuY2VzKHJlZmVyZW5jZXM6IFJlZmVyZW5jZUFzdFtdKSB7XG4gICAgZm9yIChjb25zdCByZWZlcmVuY2Ugb2YgcmVmZXJlbmNlcykge1xuICAgICAgbGV0IHR5cGU6IFN5bWJvbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAocmVmZXJlbmNlLnZhbHVlKSB7XG4gICAgICAgIHR5cGUgPSBpbmZvLnF1ZXJ5LmdldFR5cGVTeW1ib2wodG9rZW5SZWZlcmVuY2UocmVmZXJlbmNlLnZhbHVlKSk7XG4gICAgICB9XG4gICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgIG5hbWU6IHJlZmVyZW5jZS5uYW1lLFxuICAgICAgICBraW5kOiAncmVmZXJlbmNlJyxcbiAgICAgICAgdHlwZTogdHlwZSB8fCBpbmZvLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkFueSksXG4gICAgICAgIGdldCBkZWZpbml0aW9uKCkgeyByZXR1cm4gZ2V0RGVmaW5pdGlvbk9mKGluZm8sIHJlZmVyZW5jZSk7IH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZpc2l0b3IgPSBuZXcgY2xhc3MgZXh0ZW5kcyBSZWN1cnNpdmVUZW1wbGF0ZUFzdFZpc2l0b3Ige1xuICAgIHZpc2l0RW1iZWRkZWRUZW1wbGF0ZShhc3Q6IEVtYmVkZGVkVGVtcGxhdGVBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgICBzdXBlci52aXNpdEVtYmVkZGVkVGVtcGxhdGUoYXN0LCBjb250ZXh0KTtcbiAgICAgIHByb2Nlc3NSZWZlcmVuY2VzKGFzdC5yZWZlcmVuY2VzKTtcbiAgICB9XG4gICAgdmlzaXRFbGVtZW50KGFzdDogRWxlbWVudEFzdCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICAgIHN1cGVyLnZpc2l0RWxlbWVudChhc3QsIGNvbnRleHQpO1xuICAgICAgcHJvY2Vzc1JlZmVyZW5jZXMoYXN0LnJlZmVyZW5jZXMpO1xuICAgIH1cbiAgfTtcblxuICB0ZW1wbGF0ZVZpc2l0QWxsKHZpc2l0b3IsIGluZm8udGVtcGxhdGVBc3QpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGdldERlZmluaXRpb25PZihpbmZvOiBEaWFnbm9zdGljVGVtcGxhdGVJbmZvLCBhc3Q6IFRlbXBsYXRlQXN0KTogRGVmaW5pdGlvbnx1bmRlZmluZWQge1xuICBpZiAoaW5mby5maWxlTmFtZSkge1xuICAgIGNvbnN0IHRlbXBsYXRlT2Zmc2V0ID0gaW5mby5vZmZzZXQ7XG4gICAgcmV0dXJuIFt7XG4gICAgICBmaWxlTmFtZTogaW5mby5maWxlTmFtZSxcbiAgICAgIHNwYW46IHtcbiAgICAgICAgc3RhcnQ6IGFzdC5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCArIHRlbXBsYXRlT2Zmc2V0LFxuICAgICAgICBlbmQ6IGFzdC5zb3VyY2VTcGFuLmVuZC5vZmZzZXQgKyB0ZW1wbGF0ZU9mZnNldFxuICAgICAgfVxuICAgIH1dO1xuICB9XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhbGwgdmFyaWFibGUgZGVjbGFyYXRpb25zIGluIGEgdGVtcGxhdGUgYnkgdHJhdmVyc2luZyB0aGUgc3BlY2lmaWVkXG4gKiBgcGF0aGAuXG4gKiBAcGFyYW0gaW5mb1xuICogQHBhcmFtIHBhdGggdGVtcGxhdGUgQVNUIHBhdGhcbiAqL1xuZnVuY3Rpb24gZ2V0VmFyRGVjbGFyYXRpb25zKFxuICAgIGluZm86IERpYWdub3N0aWNUZW1wbGF0ZUluZm8sIHBhdGg6IFRlbXBsYXRlQXN0UGF0aCk6IFN5bWJvbERlY2xhcmF0aW9uW10ge1xuICBjb25zdCByZXN1bHRzOiBTeW1ib2xEZWNsYXJhdGlvbltdID0gW107XG4gIGZvciAobGV0IGN1cnJlbnQgPSBwYXRoLmhlYWQ7IGN1cnJlbnQ7IGN1cnJlbnQgPSBwYXRoLmNoaWxkT2YoY3VycmVudCkpIHtcbiAgICBpZiAoIShjdXJyZW50IGluc3RhbmNlb2YgRW1iZWRkZWRUZW1wbGF0ZUFzdCkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHZhcmlhYmxlIG9mIGN1cnJlbnQudmFyaWFibGVzKSB7XG4gICAgICBsZXQgc3ltYm9sID0gZ2V0VmFyaWFibGVUeXBlRnJvbURpcmVjdGl2ZUNvbnRleHQodmFyaWFibGUudmFsdWUsIGluZm8ucXVlcnksIGN1cnJlbnQpO1xuXG4gICAgICBjb25zdCBraW5kID0gaW5mby5xdWVyeS5nZXRUeXBlS2luZChzeW1ib2wpO1xuICAgICAgaWYgKGtpbmQgPT09IEJ1aWx0aW5UeXBlLkFueSB8fCBraW5kID09PSBCdWlsdGluVHlwZS5VbmJvdW5kKSB7XG4gICAgICAgIC8vIEZvciBzcGVjaWFsIGNhc2VzIHN1Y2ggYXMgbmdGb3IgYW5kIG5nSWYsIHRoZSBhbnkgdHlwZSBpcyBub3QgdmVyeSB1c2VmdWwuXG4gICAgICAgIC8vIFdlIGNhbiBkbyBiZXR0ZXIgYnkgcmVzb2x2aW5nIHRoZSBiaW5kaW5nIHZhbHVlLlxuICAgICAgICBjb25zdCBzeW1ib2xzSW5TY29wZSA9IGluZm8ucXVlcnkubWVyZ2VTeW1ib2xUYWJsZShbXG4gICAgICAgICAgaW5mby5tZW1iZXJzLFxuICAgICAgICAgIC8vIFNpbmNlIHdlIGFyZSB0cmF2ZXJzaW5nIHRoZSBBU1QgcGF0aCBmcm9tIGhlYWQgdG8gdGFpbCwgYW55IHZhcmlhYmxlc1xuICAgICAgICAgIC8vIHRoYXQgaGF2ZSBiZWVuIGRlY2xhcmVkIHNvIGZhciBhcmUgYWxzbyBpbiBzY29wZS5cbiAgICAgICAgICBpbmZvLnF1ZXJ5LmNyZWF0ZVN5bWJvbFRhYmxlKHJlc3VsdHMpLFxuICAgICAgICBdKTtcbiAgICAgICAgc3ltYm9sID0gcmVmaW5lZFZhcmlhYmxlVHlwZSh2YXJpYWJsZS52YWx1ZSwgc3ltYm9sc0luU2NvcGUsIGluZm8sIGN1cnJlbnQpO1xuICAgICAgfVxuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgbmFtZTogdmFyaWFibGUubmFtZSxcbiAgICAgICAga2luZDogJ3ZhcmlhYmxlJyxcbiAgICAgICAgdHlwZTogc3ltYm9sLCBnZXQgZGVmaW5pdGlvbigpIHsgcmV0dXJuIGdldERlZmluaXRpb25PZihpbmZvLCB2YXJpYWJsZSk7IH0sXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgdHlwZSBmb3IgdGhlIHZhcmlhYmxlIGluIGB0ZW1wbGF0ZUVsZW1lbnRgIGJ5IGZpbmRpbmcgdGhlIHN0cnVjdHVyYWxcbiAqIGRpcmVjdGl2ZSB3aGljaCBoYXMgdGhlIGNvbnRleHQgbWVtYmVyLiBSZXR1cm5zIGFueSB3aGVuIG5vdCBmb3VuZC5cbiAqIEBwYXJhbSB2YWx1ZSB2YXJpYWJsZSB2YWx1ZSBuYW1lXG4gKiBAcGFyYW0gcXVlcnkgdHlwZSBzeW1ib2wgcXVlcnlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gZ2V0VmFyaWFibGVUeXBlRnJvbURpcmVjdGl2ZUNvbnRleHQoXG4gICAgdmFsdWU6IHN0cmluZywgcXVlcnk6IFN5bWJvbFF1ZXJ5LCB0ZW1wbGF0ZUVsZW1lbnQ6IEVtYmVkZGVkVGVtcGxhdGVBc3QpOiBTeW1ib2wge1xuICBmb3IgKGNvbnN0IHtkaXJlY3RpdmV9IG9mIHRlbXBsYXRlRWxlbWVudC5kaXJlY3RpdmVzKSB7XG4gICAgY29uc3QgY29udGV4dCA9IHF1ZXJ5LmdldFRlbXBsYXRlQ29udGV4dChkaXJlY3RpdmUudHlwZS5yZWZlcmVuY2UpO1xuICAgIGlmIChjb250ZXh0KSB7XG4gICAgICBjb25zdCBtZW1iZXIgPSBjb250ZXh0LmdldCh2YWx1ZSk7XG4gICAgICBpZiAobWVtYmVyICYmIG1lbWJlci50eXBlKSB7XG4gICAgICAgIHJldHVybiBtZW1iZXIudHlwZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcXVlcnkuZ2V0QnVpbHRpblR5cGUoQnVpbHRpblR5cGUuQW55KTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgbW9yZSBzcGVjaWZpYyB0eXBlIGZvciB0aGUgdmFyaWFibGUgaW4gYHRlbXBsYXRlRWxlbWVudGAgYnkgaW5zcGVjdGluZ1xuICogYWxsIHZhcmlhYmxlcyB0aGF0IGFyZSBpbiBzY29wZSBpbiB0aGUgYG1lcmdlZFRhYmxlYC4gVGhpcyBmdW5jdGlvbiBpcyBhIHNwZWNpYWxcbiAqIGNhc2UgZm9yIGBuZ0ZvcmAgYW5kIGBuZ0lmYC4gSWYgcmVzb2x1dGlvbiBmYWlscywgcmV0dXJuIHRoZSBgYW55YCB0eXBlLlxuICogQHBhcmFtIHZhbHVlIHZhcmlhYmxlIHZhbHVlIG5hbWVcbiAqIEBwYXJhbSBtZXJnZWRUYWJsZSBzeW1ib2wgdGFibGUgZm9yIGFsbCB2YXJpYWJsZXMgaW4gc2NvcGVcbiAqIEBwYXJhbSBpbmZvIGF2YWlsYWJsZSB0ZW1wbGF0ZSBpbmZvcm1hdGlvblxuICogQHBhcmFtIHRlbXBsYXRlRWxlbWVudFxuICovXG5mdW5jdGlvbiByZWZpbmVkVmFyaWFibGVUeXBlKFxuICAgIHZhbHVlOiBzdHJpbmcsIG1lcmdlZFRhYmxlOiBTeW1ib2xUYWJsZSwgaW5mbzogRGlhZ25vc3RpY1RlbXBsYXRlSW5mbyxcbiAgICB0ZW1wbGF0ZUVsZW1lbnQ6IEVtYmVkZGVkVGVtcGxhdGVBc3QpOiBTeW1ib2wge1xuICBpZiAodmFsdWUgPT09ICckaW1wbGljaXQnKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBuZ0ZvciBkaXJlY3RpdmVcbiAgICBjb25zdCBuZ0ZvckRpcmVjdGl2ZSA9IHRlbXBsYXRlRWxlbWVudC5kaXJlY3RpdmVzLmZpbmQoZCA9PiB7XG4gICAgICBjb25zdCBuYW1lID0gaWRlbnRpZmllck5hbWUoZC5kaXJlY3RpdmUudHlwZSk7XG4gICAgICByZXR1cm4gbmFtZSA9PSAnTmdGb3InIHx8IG5hbWUgPT0gJ05nRm9yT2YnO1xuICAgIH0pO1xuICAgIGlmIChuZ0ZvckRpcmVjdGl2ZSkge1xuICAgICAgY29uc3QgbmdGb3JPZkJpbmRpbmcgPSBuZ0ZvckRpcmVjdGl2ZS5pbnB1dHMuZmluZChpID0+IGkuZGlyZWN0aXZlTmFtZSA9PSAnbmdGb3JPZicpO1xuICAgICAgaWYgKG5nRm9yT2ZCaW5kaW5nKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGEga25vd24gdHlwZSBmb3IgdGhlIG5nRm9yIGJpbmRpbmcuXG4gICAgICAgIGNvbnN0IGJpbmRpbmdUeXBlID1cbiAgICAgICAgICAgIG5ldyBBc3RUeXBlKG1lcmdlZFRhYmxlLCBpbmZvLnF1ZXJ5LCB7fSwgaW5mby5zb3VyY2UpLmdldFR5cGUobmdGb3JPZkJpbmRpbmcudmFsdWUpO1xuICAgICAgICBpZiAoYmluZGluZ1R5cGUpIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBpbmZvLnF1ZXJ5LmdldEVsZW1lbnRUeXBlKGJpbmRpbmdUeXBlKTtcbiAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh2YWx1ZSA9PT0gJ25nSWYnIHx8IHZhbHVlID09PSAnJGltcGxpY2l0Jykge1xuICAgIGNvbnN0IG5nSWZEaXJlY3RpdmUgPVxuICAgICAgICB0ZW1wbGF0ZUVsZW1lbnQuZGlyZWN0aXZlcy5maW5kKGQgPT4gaWRlbnRpZmllck5hbWUoZC5kaXJlY3RpdmUudHlwZSkgPT09ICdOZ0lmJyk7XG4gICAgaWYgKG5nSWZEaXJlY3RpdmUpIHtcbiAgICAgIC8vIFNwZWNpYWwgY2FzZTogbmdJZiBkaXJlY3RpdmUuIFRoZSBOZ0lmIHN0cnVjdHVyYWwgZGlyZWN0aXZlIG93bnMgYSB0ZW1wbGF0ZSBjb250ZXh0IHdpdGhcbiAgICAgIC8vIFwiJGltcGxpY2l0XCIgYW5kIFwibmdJZlwiIG1lbWJlcnMuIFRoZXNlIHByb3BlcnRpZXMgYXJlIHR5cGVkIGFzIGdlbmVyaWNzLiBVbnRpbCB0aGUgbGFuZ3VhZ2VcbiAgICAgIC8vIHNlcnZpY2UgdXNlcyBhbiBJdnkgYW5kIFR5cGVjaGVja0Jsb2NrIGJhY2tlbmQsIHdlIGNhbm5vdCBiaW5kIHRoZXNlIHZhbHVlcyB0byBhIGNvbmNyZXRlXG4gICAgICAvLyB0eXBlIHdpdGhvdXQgbWFudWFsIGluZmVyZW5jZS4gVG8gZ2V0IHRoZSBjb25jcmV0ZSB0eXBlLCBsb29rIHVwIHRoZSB0eXBlIG9mIHRoZSBcIm5nSWZcIlxuICAgICAgLy8gaW1wb3J0IG9uIHRoZSBOZ0lmIGRpcmVjdGl2ZSBib3VuZCB0byB0aGUgdGVtcGxhdGUuXG4gICAgICAvL1xuICAgICAgLy8gU2VlIEBhbmd1bGFyL2NvbW1vbi9uZ19pZi50cyBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICAgIGNvbnN0IG5nSWZCaW5kaW5nID0gbmdJZkRpcmVjdGl2ZS5pbnB1dHMuZmluZChpID0+IGkuZGlyZWN0aXZlTmFtZSA9PT0gJ25nSWYnKTtcbiAgICAgIGlmIChuZ0lmQmluZGluZykge1xuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIGtub3duIHR5cGUgYm91bmQgdG8gdGhlIG5nSWYgaW5wdXQuXG4gICAgICAgIGNvbnN0IGJpbmRpbmdUeXBlID1cbiAgICAgICAgICAgIG5ldyBBc3RUeXBlKG1lcmdlZFRhYmxlLCBpbmZvLnF1ZXJ5LCB7fSwgaW5mby5zb3VyY2UpLmdldFR5cGUobmdJZkJpbmRpbmcudmFsdWUpO1xuICAgICAgICBpZiAoYmluZGluZ1R5cGUpIHtcbiAgICAgICAgICByZXR1cm4gYmluZGluZ1R5cGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBXZSBjYW4ndCBkbyBiZXR0ZXIsIHJldHVybiBhbnlcbiAgcmV0dXJuIGluZm8ucXVlcnkuZ2V0QnVpbHRpblR5cGUoQnVpbHRpblR5cGUuQW55KTtcbn1cblxuZnVuY3Rpb24gZ2V0RXZlbnREZWNsYXJhdGlvbihcbiAgICBpbmZvOiBEaWFnbm9zdGljVGVtcGxhdGVJbmZvLCBwYXRoOiBUZW1wbGF0ZUFzdFBhdGgpOiBTeW1ib2xEZWNsYXJhdGlvbnx1bmRlZmluZWQge1xuICBjb25zdCBldmVudCA9IHBhdGgudGFpbDtcbiAgaWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBCb3VuZEV2ZW50QXN0KSkge1xuICAgIC8vIE5vIGV2ZW50IGF2YWlsYWJsZSBpbiB0aGlzIGNvbnRleHQuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZ2VuZXJpY0V2ZW50OiBTeW1ib2xEZWNsYXJhdGlvbiA9IHtcbiAgICBuYW1lOiAnJGV2ZW50JyxcbiAgICBraW5kOiAndmFyaWFibGUnLFxuICAgIHR5cGU6IGluZm8ucXVlcnkuZ2V0QnVpbHRpblR5cGUoQnVpbHRpblR5cGUuQW55KSxcbiAgfTtcblxuICBjb25zdCBvdXRwdXRTeW1ib2wgPSBmaW5kT3V0cHV0QmluZGluZyhldmVudCwgcGF0aCwgaW5mby5xdWVyeSk7XG4gIGlmICghb3V0cHV0U3ltYm9sKSB7XG4gICAgLy8gVGhlIGAkZXZlbnRgIHZhcmlhYmxlIGRvZXNuJ3QgYmVsb25nIHRvIGFuIG91dHB1dCwgc28gaXRzIHR5cGUgY2FuJ3QgYmUgcmVmaW5lZC5cbiAgICAvLyBUT0RPOiB0eXBlIGAkZXZlbnRgIHZhcmlhYmxlcyBpbiBiaW5kaW5ncyB0byBET00gZXZlbnRzLlxuICAgIHJldHVybiBnZW5lcmljRXZlbnQ7XG4gIH1cblxuICAvLyBUaGUgcmF3IGV2ZW50IHR5cGUgaXMgd3JhcHBlZCBpbiBhIGdlbmVyaWMsIGxpa2UgRXZlbnRFbWl0dGVyPFQ+IG9yIE9ic2VydmFibGU8VD4uXG4gIGNvbnN0IHRhID0gb3V0cHV0U3ltYm9sLnR5cGVBcmd1bWVudHMoKTtcbiAgaWYgKCF0YSB8fCB0YS5sZW5ndGggIT09IDEpIHJldHVybiBnZW5lcmljRXZlbnQ7XG4gIGNvbnN0IGV2ZW50VHlwZSA9IHRhWzBdO1xuXG4gIHJldHVybiB7Li4uZ2VuZXJpY0V2ZW50LCB0eXBlOiBldmVudFR5cGV9O1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHN5bWJvbHMgYXZhaWxhYmxlIGluIGEgcGFydGljdWxhciBzY29wZSBvZiBhIHRlbXBsYXRlLlxuICogQHBhcmFtIGluZm8gcGFyc2VkIHRlbXBsYXRlIGluZm9ybWF0aW9uXG4gKiBAcGFyYW0gcGF0aCBwYXRoIG9mIHRlbXBsYXRlIG5vZGVzIG5hcnJvd2luZyB0byB0aGUgY29udGV4dCB0aGUgZXhwcmVzc2lvbiBzY29wZSBzaG91bGQgYmVcbiAqIGRlcml2ZWQgZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXhwcmVzc2lvblNjb3BlKFxuICAgIGluZm86IERpYWdub3N0aWNUZW1wbGF0ZUluZm8sIHBhdGg6IFRlbXBsYXRlQXN0UGF0aCk6IFN5bWJvbFRhYmxlIHtcbiAgbGV0IHJlc3VsdCA9IGluZm8ubWVtYmVycztcbiAgY29uc3QgcmVmZXJlbmNlcyA9IGdldFJlZmVyZW5jZXMoaW5mbyk7XG4gIGNvbnN0IHZhcmlhYmxlcyA9IGdldFZhckRlY2xhcmF0aW9ucyhpbmZvLCBwYXRoKTtcbiAgY29uc3QgZXZlbnQgPSBnZXRFdmVudERlY2xhcmF0aW9uKGluZm8sIHBhdGgpO1xuICBpZiAocmVmZXJlbmNlcy5sZW5ndGggfHwgdmFyaWFibGVzLmxlbmd0aCB8fCBldmVudCkge1xuICAgIGNvbnN0IHJlZmVyZW5jZVRhYmxlID0gaW5mby5xdWVyeS5jcmVhdGVTeW1ib2xUYWJsZShyZWZlcmVuY2VzKTtcbiAgICBjb25zdCB2YXJpYWJsZVRhYmxlID0gaW5mby5xdWVyeS5jcmVhdGVTeW1ib2xUYWJsZSh2YXJpYWJsZXMpO1xuICAgIGNvbnN0IGV2ZW50c1RhYmxlID0gaW5mby5xdWVyeS5jcmVhdGVTeW1ib2xUYWJsZShldmVudCA/IFtldmVudF0gOiBbXSk7XG4gICAgcmVzdWx0ID0gaW5mby5xdWVyeS5tZXJnZVN5bWJvbFRhYmxlKFtyZXN1bHQsIHJlZmVyZW5jZVRhYmxlLCB2YXJpYWJsZVRhYmxlLCBldmVudHNUYWJsZV0pO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmNsYXNzIEV4cHJlc3Npb25EaWFnbm9zdGljc1Zpc2l0b3IgZXh0ZW5kcyBSZWN1cnNpdmVUZW1wbGF0ZUFzdFZpc2l0b3Ige1xuICBwcml2YXRlIHBhdGg6IFRlbXBsYXRlQXN0UGF0aDtcbiAgcHJpdmF0ZSBkaXJlY3RpdmVTdW1tYXJ5OiBDb21waWxlRGlyZWN0aXZlU3VtbWFyeXx1bmRlZmluZWQ7XG5cbiAgZGlhZ25vc3RpY3M6IG5nLkRpYWdub3N0aWNbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBpbmZvOiBEaWFnbm9zdGljVGVtcGxhdGVJbmZvLFxuICAgICAgcHJpdmF0ZSBnZXRFeHByZXNzaW9uU2NvcGU6IChwYXRoOiBUZW1wbGF0ZUFzdFBhdGgsIGluY2x1ZGVFdmVudDogYm9vbGVhbikgPT4gU3ltYm9sVGFibGUpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucGF0aCA9IG5ldyBBc3RQYXRoPFRlbXBsYXRlQXN0PihbXSk7XG4gIH1cblxuICB2aXNpdERpcmVjdGl2ZShhc3Q6IERpcmVjdGl2ZUFzdCwgY29udGV4dDogYW55KTogYW55IHtcbiAgICAvLyBPdmVycmlkZSB0aGUgZGVmYXVsdCBjaGlsZCB2aXNpdG9yIHRvIGlnbm9yZSB0aGUgaG9zdCBwcm9wZXJ0aWVzIG9mIGEgZGlyZWN0aXZlLlxuICAgIGlmIChhc3QuaW5wdXRzICYmIGFzdC5pbnB1dHMubGVuZ3RoKSB7XG4gICAgICB0ZW1wbGF0ZVZpc2l0QWxsKHRoaXMsIGFzdC5pbnB1dHMsIGNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIHZpc2l0Qm91bmRUZXh0KGFzdDogQm91bmRUZXh0QXN0KTogdm9pZCB7XG4gICAgdGhpcy5wdXNoKGFzdCk7XG4gICAgdGhpcy5kaWFnbm9zZUV4cHJlc3Npb24oYXN0LnZhbHVlLCBhc3Quc291cmNlU3Bhbi5zdGFydC5vZmZzZXQsIGZhbHNlKTtcbiAgICB0aGlzLnBvcCgpO1xuICB9XG5cbiAgdmlzaXREaXJlY3RpdmVQcm9wZXJ0eShhc3Q6IEJvdW5kRGlyZWN0aXZlUHJvcGVydHlBc3QpOiB2b2lkIHtcbiAgICB0aGlzLnB1c2goYXN0KTtcbiAgICB0aGlzLmRpYWdub3NlRXhwcmVzc2lvbihhc3QudmFsdWUsIHRoaXMuYXR0cmlidXRlVmFsdWVMb2NhdGlvbihhc3QpLCBmYWxzZSk7XG4gICAgdGhpcy5wb3AoKTtcbiAgfVxuXG4gIHZpc2l0RWxlbWVudFByb3BlcnR5KGFzdDogQm91bmRFbGVtZW50UHJvcGVydHlBc3QpOiB2b2lkIHtcbiAgICB0aGlzLnB1c2goYXN0KTtcbiAgICB0aGlzLmRpYWdub3NlRXhwcmVzc2lvbihhc3QudmFsdWUsIHRoaXMuYXR0cmlidXRlVmFsdWVMb2NhdGlvbihhc3QpLCBmYWxzZSk7XG4gICAgdGhpcy5wb3AoKTtcbiAgfVxuXG4gIHZpc2l0RXZlbnQoYXN0OiBCb3VuZEV2ZW50QXN0KTogdm9pZCB7XG4gICAgdGhpcy5wdXNoKGFzdCk7XG4gICAgdGhpcy5kaWFnbm9zZUV4cHJlc3Npb24oYXN0LmhhbmRsZXIsIHRoaXMuYXR0cmlidXRlVmFsdWVMb2NhdGlvbihhc3QpLCB0cnVlKTtcbiAgICB0aGlzLnBvcCgpO1xuICB9XG5cbiAgdmlzaXRWYXJpYWJsZShhc3Q6IFZhcmlhYmxlQXN0KTogdm9pZCB7XG4gICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5kaXJlY3RpdmVTdW1tYXJ5O1xuICAgIGlmIChkaXJlY3RpdmUgJiYgYXN0LnZhbHVlKSB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5pbmZvLnF1ZXJ5LmdldFRlbXBsYXRlQ29udGV4dChkaXJlY3RpdmUudHlwZS5yZWZlcmVuY2UpICE7XG4gICAgICBpZiAoY29udGV4dCAmJiAhY29udGV4dC5oYXMoYXN0LnZhbHVlKSkge1xuICAgICAgICBjb25zdCBtaXNzaW5nTWVtYmVyID1cbiAgICAgICAgICAgIGFzdC52YWx1ZSA9PT0gJyRpbXBsaWNpdCcgPyAnYW4gaW1wbGljaXQgdmFsdWUnIDogYGEgbWVtYmVyIGNhbGxlZCAnJHthc3QudmFsdWV9J2A7XG5cbiAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMuYWJzU3BhbihzcGFuT2YoYXN0LnNvdXJjZVNwYW4pKTtcbiAgICAgICAgdGhpcy5kaWFnbm9zdGljcy5wdXNoKGNyZWF0ZURpYWdub3N0aWMoXG4gICAgICAgICAgICBzcGFuLCBEaWFnbm9zdGljLnRlbXBsYXRlX2NvbnRleHRfbWlzc2luZ19tZW1iZXIsIGRpcmVjdGl2ZS50eXBlLnJlZmVyZW5jZS5uYW1lLFxuICAgICAgICAgICAgbWlzc2luZ01lbWJlcikpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHZpc2l0RWxlbWVudChhc3Q6IEVsZW1lbnRBc3QsIGNvbnRleHQ6IGFueSk6IHZvaWQge1xuICAgIHRoaXMucHVzaChhc3QpO1xuICAgIHN1cGVyLnZpc2l0RWxlbWVudChhc3QsIGNvbnRleHQpO1xuICAgIHRoaXMucG9wKCk7XG4gIH1cblxuICB2aXNpdEVtYmVkZGVkVGVtcGxhdGUoYXN0OiBFbWJlZGRlZFRlbXBsYXRlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IHByZXZpb3VzRGlyZWN0aXZlU3VtbWFyeSA9IHRoaXMuZGlyZWN0aXZlU3VtbWFyeTtcblxuICAgIHRoaXMucHVzaChhc3QpO1xuXG4gICAgLy8gRmluZCBkaXJlY3RpdmUgdGhhdCByZWZlcmVuY2VzIHRoaXMgdGVtcGxhdGVcbiAgICB0aGlzLmRpcmVjdGl2ZVN1bW1hcnkgPVxuICAgICAgICBhc3QuZGlyZWN0aXZlcy5tYXAoZCA9PiBkLmRpcmVjdGl2ZSkuZmluZChkID0+IGhhc1RlbXBsYXRlUmVmZXJlbmNlKGQudHlwZSkpICE7XG5cbiAgICAvLyBQcm9jZXNzIGNoaWxkcmVuXG4gICAgc3VwZXIudmlzaXRFbWJlZGRlZFRlbXBsYXRlKGFzdCwgY29udGV4dCk7XG5cbiAgICB0aGlzLnBvcCgpO1xuXG4gICAgdGhpcy5kaXJlY3RpdmVTdW1tYXJ5ID0gcHJldmlvdXNEaXJlY3RpdmVTdW1tYXJ5O1xuICB9XG5cbiAgcHJpdmF0ZSBhdHRyaWJ1dGVWYWx1ZUxvY2F0aW9uKGFzdDogVGVtcGxhdGVBc3QpIHtcbiAgICBjb25zdCBwYXRoID0gZ2V0UGF0aFRvTm9kZUF0UG9zaXRpb24odGhpcy5pbmZvLmh0bWxBc3QsIGFzdC5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCk7XG4gICAgY29uc3QgbGFzdCA9IHBhdGgudGFpbDtcbiAgICBpZiAobGFzdCBpbnN0YW5jZW9mIEF0dHJpYnV0ZSAmJiBsYXN0LnZhbHVlU3Bhbikge1xuICAgICAgcmV0dXJuIGxhc3QudmFsdWVTcGFuLnN0YXJ0Lm9mZnNldDtcbiAgICB9XG4gICAgcmV0dXJuIGFzdC5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldDtcbiAgfVxuXG4gIHByaXZhdGUgZGlhZ25vc2VFeHByZXNzaW9uKGFzdDogQVNULCBvZmZzZXQ6IG51bWJlciwgaW5FdmVudDogYm9vbGVhbikge1xuICAgIGNvbnN0IHNjb3BlID0gdGhpcy5nZXRFeHByZXNzaW9uU2NvcGUodGhpcy5wYXRoLCBpbkV2ZW50KTtcbiAgICBjb25zdCBhbmFseXplciA9IG5ldyBBc3RUeXBlKHNjb3BlLCB0aGlzLmluZm8ucXVlcnksIHtpbkV2ZW50fSwgdGhpcy5pbmZvLnNvdXJjZSk7XG4gICAgZm9yIChjb25zdCBkaWFnbm9zdGljIG9mIGFuYWx5emVyLmdldERpYWdub3N0aWNzKGFzdCkpIHtcbiAgICAgIGRpYWdub3N0aWMuc3BhbiA9IHRoaXMuYWJzU3BhbihkaWFnbm9zdGljLnNwYW4sIG9mZnNldCk7XG4gICAgICB0aGlzLmRpYWdub3N0aWNzLnB1c2goZGlhZ25vc3RpYyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwdXNoKGFzdDogVGVtcGxhdGVBc3QpIHsgdGhpcy5wYXRoLnB1c2goYXN0KTsgfVxuXG4gIHByaXZhdGUgcG9wKCkgeyB0aGlzLnBhdGgucG9wKCk7IH1cblxuICBwcml2YXRlIGFic1NwYW4oc3BhbjogU3BhbiwgYWRkaXRpb25hbE9mZnNldDogbnVtYmVyID0gMCk6IFNwYW4ge1xuICAgIHJldHVybiB7XG4gICAgICBzdGFydDogc3Bhbi5zdGFydCArIHRoaXMuaW5mby5vZmZzZXQgKyBhZGRpdGlvbmFsT2Zmc2V0LFxuICAgICAgZW5kOiBzcGFuLmVuZCArIHRoaXMuaW5mby5vZmZzZXQgKyBhZGRpdGlvbmFsT2Zmc2V0LFxuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFzVGVtcGxhdGVSZWZlcmVuY2UodHlwZTogQ29tcGlsZVR5cGVNZXRhZGF0YSk6IGJvb2xlYW4ge1xuICBpZiAodHlwZS5kaURlcHMpIHtcbiAgICBmb3IgKGxldCBkaURlcCBvZiB0eXBlLmRpRGVwcykge1xuICAgICAgaWYgKGRpRGVwLnRva2VuICYmIGRpRGVwLnRva2VuLmlkZW50aWZpZXIgJiZcbiAgICAgICAgICBpZGVudGlmaWVyTmFtZShkaURlcC50b2tlbiAhLmlkZW50aWZpZXIgISkgPT0gJ1RlbXBsYXRlUmVmJylcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc3Bhbk9mKHNvdXJjZVNwYW46IFBhcnNlU291cmNlU3Bhbik6IFNwYW4ge1xuICByZXR1cm4ge3N0YXJ0OiBzb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCwgZW5kOiBzb3VyY2VTcGFuLmVuZC5vZmZzZXR9O1xufVxuIl19