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
        define("@angular/language-service/src/utils", ["require", "exports", "tslib", "@angular/compiler", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var ts = require("typescript");
    function isParseSourceSpan(value) {
        return value && !!value.start;
    }
    exports.isParseSourceSpan = isParseSourceSpan;
    function spanOf(span) {
        if (!span)
            return undefined;
        if (isParseSourceSpan(span)) {
            return { start: span.start.offset, end: span.end.offset };
        }
        else {
            if (span.endSourceSpan) {
                return { start: span.sourceSpan.start.offset, end: span.endSourceSpan.end.offset };
            }
            else if (span.children && span.children.length) {
                return {
                    start: span.sourceSpan.start.offset,
                    end: spanOf(span.children[span.children.length - 1]).end
                };
            }
            return { start: span.sourceSpan.start.offset, end: span.sourceSpan.end.offset };
        }
    }
    exports.spanOf = spanOf;
    function inSpan(position, span, exclusive) {
        return span != null && (exclusive ? position >= span.start && position < span.end :
            position >= span.start && position <= span.end);
    }
    exports.inSpan = inSpan;
    function offsetSpan(span, amount) {
        return { start: span.start + amount, end: span.end + amount };
    }
    exports.offsetSpan = offsetSpan;
    function isNarrower(spanA, spanB) {
        return spanA.start >= spanB.start && spanA.end <= spanB.end;
    }
    exports.isNarrower = isNarrower;
    function isStructuralDirective(type) {
        var e_1, _a;
        var _b;
        try {
            for (var _c = tslib_1.__values(type.diDeps), _d = _c.next(); !_d.done; _d = _c.next()) {
                var diDep = _d.value;
                var diDepName = compiler_1.identifierName((_b = diDep.token) === null || _b === void 0 ? void 0 : _b.identifier);
                if (diDepName === compiler_1.Identifiers.TemplateRef.name ||
                    diDepName === compiler_1.Identifiers.ViewContainerRef.name) {
                    return true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return false;
    }
    exports.isStructuralDirective = isStructuralDirective;
    function getSelectors(info) {
        var e_2, _a, e_3, _b;
        var map = new Map();
        var results = [];
        try {
            for (var _c = tslib_1.__values(info.directives), _d = _c.next(); !_d.done; _d = _c.next()) {
                var directive = _d.value;
                var selectors = compiler_1.CssSelector.parse(directive.selector);
                try {
                    for (var selectors_1 = (e_3 = void 0, tslib_1.__values(selectors)), selectors_1_1 = selectors_1.next(); !selectors_1_1.done; selectors_1_1 = selectors_1.next()) {
                        var selector = selectors_1_1.value;
                        results.push(selector);
                        map.set(selector, directive);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (selectors_1_1 && !selectors_1_1.done && (_b = selectors_1.return)) _b.call(selectors_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return { selectors: results, map: map };
    }
    exports.getSelectors = getSelectors;
    function isTypescriptVersion(low, high) {
        var version = ts.version;
        if (version.substring(0, low.length) < low)
            return false;
        if (high && (version.substring(0, high.length) > high))
            return false;
        return true;
    }
    exports.isTypescriptVersion = isTypescriptVersion;
    function diagnosticInfoFromTemplateInfo(info) {
        return {
            fileName: info.template.fileName,
            offset: info.template.span.start,
            query: info.template.query,
            members: info.template.members,
            htmlAst: info.htmlAst,
            templateAst: info.templateAst,
            source: info.template.source,
        };
    }
    exports.diagnosticInfoFromTemplateInfo = diagnosticInfoFromTemplateInfo;
    function findTemplateAstAt(ast, position) {
        var path = [];
        var visitor = new /** @class */ (function (_super) {
            tslib_1.__extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.visit = function (ast) {
                var span = spanOf(ast);
                if (inSpan(position, span)) {
                    var len = path.length;
                    if (!len || isNarrower(span, spanOf(path[len - 1]))) {
                        path.push(ast);
                    }
                }
                else {
                    // Returning a value here will result in the children being skipped.
                    return true;
                }
            };
            class_1.prototype.visitEmbeddedTemplate = function (ast, context) {
                return this.visitChildren(context, function (visit) {
                    // Ignore reference, variable and providers
                    visit(ast.attrs);
                    visit(ast.directives);
                    visit(ast.children);
                });
            };
            class_1.prototype.visitElement = function (ast, context) {
                return this.visitChildren(context, function (visit) {
                    // Ingnore providers
                    visit(ast.attrs);
                    visit(ast.inputs);
                    visit(ast.outputs);
                    visit(ast.references);
                    visit(ast.directives);
                    visit(ast.children);
                });
            };
            class_1.prototype.visitDirective = function (ast, context) {
                // Ignore the host properties of a directive
                var result = this.visitChildren(context, function (visit) { visit(ast.inputs); });
                // We never care about the diretive itself, just its inputs.
                if (path[path.length - 1] === ast) {
                    path.pop();
                }
                return result;
            };
            return class_1;
        }(compiler_1.RecursiveTemplateAstVisitor));
        compiler_1.templateVisitAll(visitor, ast);
        return new compiler_1.AstPath(path, position);
    }
    exports.findTemplateAstAt = findTemplateAstAt;
    /**
     * Return the node that most tightly encompass the specified `position`.
     * @param node
     * @param position
     */
    function findTightestNode(node, position) {
        if (node.getStart() <= position && position < node.getEnd()) {
            return node.forEachChild(function (c) { return findTightestNode(c, position); }) || node;
        }
    }
    exports.findTightestNode = findTightestNode;
    /**
     * Return metadata about `node` if it looks like an Angular directive class.
     * In this case, potential matches are `@NgModule`, `@Component`, `@Directive`,
     * `@Pipe`, etc.
     * These class declarations all share some common attributes, namely their
     * decorator takes exactly one parameter and the parameter must be an object
     * literal.
     *
     * For example,
     *     v---------- `decoratorId`
     * @NgModule({           <
     *   declarations: [],   < classDecl
     * })                    <
     * class AppModule {}    <
     *          ^----- `classId`
     *
     * @param node Potential node that represents an Angular directive.
     */
    function getDirectiveClassLike(node) {
        var e_4, _a;
        if (!ts.isClassDeclaration(node) || !node.name || !node.decorators) {
            return;
        }
        try {
            for (var _b = tslib_1.__values(node.decorators), _c = _b.next(); !_c.done; _c = _b.next()) {
                var d = _c.value;
                var expr = d.expression;
                if (!ts.isCallExpression(expr) || expr.arguments.length !== 1 ||
                    !ts.isIdentifier(expr.expression)) {
                    continue;
                }
                var arg = expr.arguments[0];
                if (ts.isObjectLiteralExpression(arg)) {
                    return {
                        decoratorId: expr.expression,
                        classId: node.name,
                    };
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
    }
    exports.getDirectiveClassLike = getDirectiveClassLike;
    /**
     * Finds the value of a property assignment that is nested in a TypeScript node and is of a certain
     * type T.
     *
     * @param startNode node to start searching for nested property assignment from
     * @param propName property assignment name
     * @param predicate function to verify that a node is of type T.
     * @return node property assignment value of type T, or undefined if none is found
     */
    function findPropertyValueOfType(startNode, propName, predicate) {
        if (ts.isPropertyAssignment(startNode) && startNode.name.getText() === propName) {
            var initializer = startNode.initializer;
            if (predicate(initializer))
                return initializer;
        }
        return startNode.forEachChild(function (c) { return findPropertyValueOfType(c, propName, predicate); });
    }
    exports.findPropertyValueOfType = findPropertyValueOfType;
    /**
     * Find the tightest node at the specified `position` from the AST `nodes`, and
     * return the path to the node.
     * @param nodes HTML AST nodes
     * @param position
     */
    function getPathToNodeAtPosition(nodes, position) {
        var path = [];
        var visitor = new /** @class */ (function (_super) {
            tslib_1.__extends(class_2, _super);
            function class_2() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_2.prototype.visit = function (ast) {
                var span = spanOf(ast);
                if (inSpan(position, span)) {
                    path.push(ast);
                }
                else {
                    // Returning a truthy value here will skip all children and terminate
                    // the visit.
                    return true;
                }
            };
            return class_2;
        }(compiler_1.RecursiveVisitor));
        compiler_1.visitAll(visitor, nodes);
        return new compiler_1.AstPath(path, position);
    }
    exports.getPathToNodeAtPosition = getPathToNodeAtPosition;
    /**
     * Inverts an object's key-value pairs.
     */
    function invertMap(obj) {
        var e_5, _a;
        var result = {};
        try {
            for (var _b = tslib_1.__values(Object.keys(obj)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var name_1 = _c.value;
                var v = obj[name_1];
                result[v] = name_1;
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return result;
    }
    exports.invertMap = invertMap;
    /**
     * Finds the directive member providing a template output binding, if one exists.
     * @param info aggregate template AST information
     * @param path narrowing
     */
    function findOutputBinding(binding, path, query) {
        var e_6, _a;
        var element = path.first(compiler_1.ElementAst);
        if (element) {
            try {
                for (var _b = tslib_1.__values(element.directives), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var directive = _c.value;
                    var invertedOutputs = invertMap(directive.directive.outputs);
                    var fieldName = invertedOutputs[binding.name];
                    if (fieldName) {
                        var classSymbol = query.getTypeSymbol(directive.directive.type.reference);
                        if (classSymbol) {
                            return classSymbol.members().get(fieldName);
                        }
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
        }
    }
    exports.findOutputBinding = findOutputBinding;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCw4Q0FBNlU7SUFDN1UsK0JBQWlDO0lBWWpDLFNBQWdCLGlCQUFpQixDQUFDLEtBQVU7UUFDMUMsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDaEMsQ0FBQztJQUZELDhDQUVDO0lBS0QsU0FBZ0IsTUFBTSxDQUFDLElBQW1DO1FBQ3hELElBQUksQ0FBQyxJQUFJO1lBQUUsT0FBTyxTQUFTLENBQUM7UUFDNUIsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMzQixPQUFPLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBQyxDQUFDO1NBQ3pEO2FBQU07WUFDTCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7Z0JBQ3RCLE9BQU8sRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUMsQ0FBQzthQUNsRjtpQkFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hELE9BQU87b0JBQ0wsS0FBSyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU07b0JBQ25DLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBRyxDQUFDLEdBQUc7aUJB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QUFBLEtBQUEsaUJBQUEsT0FBTyxDQUFDLFVBQVUsQ0FBQSxnQkFBQSw0QkFBRTtvQkFBdkMsSUFBTSxTQUFTLFdBQUE7b0JBQ2xCLElBQU0sZUFBZSxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvRCxJQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNoRCxJQUFJLFNBQVMsRUFBRTt3QkFDYixJQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUM1RSxJQUFJLFdBQVcsRUFBRTs0QkFDZixPQUFPLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7eUJBQzdDO3FCQUNGO2lCQUNGOzs7Ozs7Ozs7U0FDRjtJQUNILENBQUM7SUFmRCw4Q0FlQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBc3RQYXRoLCBCb3VuZEV2ZW50QXN0LCBDb21waWxlRGlyZWN0aXZlU3VtbWFyeSwgQ29tcGlsZVR5cGVNZXRhZGF0YSwgQ3NzU2VsZWN0b3IsIERpcmVjdGl2ZUFzdCwgRWxlbWVudEFzdCwgRW1iZWRkZWRUZW1wbGF0ZUFzdCwgSHRtbEFzdFBhdGgsIElkZW50aWZpZXJzLCBOb2RlLCBQYXJzZVNvdXJjZVNwYW4sIFJlY3Vyc2l2ZVRlbXBsYXRlQXN0VmlzaXRvciwgUmVjdXJzaXZlVmlzaXRvciwgVGVtcGxhdGVBc3QsIFRlbXBsYXRlQXN0UGF0aCwgaWRlbnRpZmllck5hbWUsIHRlbXBsYXRlVmlzaXRBbGwsIHZpc2l0QWxsfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcblxuaW1wb3J0IHtBc3RSZXN1bHQsIFNlbGVjdG9ySW5mb30gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHtEaWFnbm9zdGljVGVtcGxhdGVJbmZvfSBmcm9tICcuL2V4cHJlc3Npb25fZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHtTcGFuLCBTeW1ib2wsIFN5bWJvbFF1ZXJ5fSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBTcGFuSG9sZGVyIHtcbiAgc291cmNlU3BhbjogUGFyc2VTb3VyY2VTcGFuO1xuICBlbmRTb3VyY2VTcGFuPzogUGFyc2VTb3VyY2VTcGFufG51bGw7XG4gIGNoaWxkcmVuPzogU3BhbkhvbGRlcltdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQYXJzZVNvdXJjZVNwYW4odmFsdWU6IGFueSk6IHZhbHVlIGlzIFBhcnNlU291cmNlU3BhbiB7XG4gIHJldHVybiB2YWx1ZSAmJiAhIXZhbHVlLnN0YXJ0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3Bhbk9mKHNwYW46IFNwYW5Ib2xkZXIpOiBTcGFuO1xuZXhwb3J0IGZ1bmN0aW9uIHNwYW5PZihzcGFuOiBQYXJzZVNvdXJjZVNwYW4pOiBTcGFuO1xuZXhwb3J0IGZ1bmN0aW9uIHNwYW5PZihzcGFuOiBTcGFuSG9sZGVyIHwgUGFyc2VTb3VyY2VTcGFuIHwgdW5kZWZpbmVkKTogU3Bhbnx1bmRlZmluZWQ7XG5leHBvcnQgZnVuY3Rpb24gc3Bhbk9mKHNwYW4/OiBTcGFuSG9sZGVyIHwgUGFyc2VTb3VyY2VTcGFuKTogU3Bhbnx1bmRlZmluZWQge1xuICBpZiAoIXNwYW4pIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmIChpc1BhcnNlU291cmNlU3BhbihzcGFuKSkge1xuICAgIHJldHVybiB7c3RhcnQ6IHNwYW4uc3RhcnQub2Zmc2V0LCBlbmQ6IHNwYW4uZW5kLm9mZnNldH07XG4gIH0gZWxzZSB7XG4gICAgaWYgKHNwYW4uZW5kU291cmNlU3Bhbikge1xuICAgICAgcmV0dXJuIHtzdGFydDogc3Bhbi5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCwgZW5kOiBzcGFuLmVuZFNvdXJjZVNwYW4uZW5kLm9mZnNldH07XG4gICAgfSBlbHNlIGlmIChzcGFuLmNoaWxkcmVuICYmIHNwYW4uY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGFydDogc3Bhbi5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCxcbiAgICAgICAgZW5kOiBzcGFuT2Yoc3Bhbi5jaGlsZHJlbltzcGFuLmNoaWxkcmVuLmxlbmd0aCAtIDFdKSAhLmVuZFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtzdGFydDogc3Bhbi5zb3VyY2VTcGFuLnN0YXJ0Lm9mZnNldCwgZW5kOiBzcGFuLnNvdXJjZVNwYW4uZW5kLm9mZnNldH07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluU3Bhbihwb3NpdGlvbjogbnVtYmVyLCBzcGFuPzogU3BhbiwgZXhjbHVzaXZlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gc3BhbiAhPSBudWxsICYmIChleGNsdXNpdmUgPyBwb3NpdGlvbiA+PSBzcGFuLnN0YXJ0ICYmIHBvc2l0aW9uIDwgc3Bhbi5lbmQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA+PSBzcGFuLnN0YXJ0ICYmIHBvc2l0aW9uIDw9IHNwYW4uZW5kKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9mZnNldFNwYW4oc3BhbjogU3BhbiwgYW1vdW50OiBudW1iZXIpOiBTcGFuIHtcbiAgcmV0dXJuIHtzdGFydDogc3Bhbi5zdGFydCArIGFtb3VudCwgZW5kOiBzcGFuLmVuZCArIGFtb3VudH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05hcnJvd2VyKHNwYW5BOiBTcGFuLCBzcGFuQjogU3Bhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gc3BhbkEuc3RhcnQgPj0gc3BhbkIuc3RhcnQgJiYgc3BhbkEuZW5kIDw9IHNwYW5CLmVuZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3RydWN0dXJhbERpcmVjdGl2ZSh0eXBlOiBDb21waWxlVHlwZU1ldGFkYXRhKTogYm9vbGVhbiB7XG4gIGZvciAoY29uc3QgZGlEZXAgb2YgdHlwZS5kaURlcHMpIHtcbiAgICBjb25zdCBkaURlcE5hbWUgPSBpZGVudGlmaWVyTmFtZShkaURlcC50b2tlbj8uaWRlbnRpZmllcik7XG4gICAgaWYgKGRpRGVwTmFtZSA9PT0gSWRlbnRpZmllcnMuVGVtcGxhdGVSZWYubmFtZSB8fFxuICAgICAgICBkaURlcE5hbWUgPT09IElkZW50aWZpZXJzLlZpZXdDb250YWluZXJSZWYubmFtZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdG9ycyhpbmZvOiBBc3RSZXN1bHQpOiBTZWxlY3RvckluZm8ge1xuICBjb25zdCBtYXAgPSBuZXcgTWFwPENzc1NlbGVjdG9yLCBDb21waWxlRGlyZWN0aXZlU3VtbWFyeT4oKTtcbiAgY29uc3QgcmVzdWx0czogQ3NzU2VsZWN0b3JbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGRpcmVjdGl2ZSBvZiBpbmZvLmRpcmVjdGl2ZXMpIHtcbiAgICBjb25zdCBzZWxlY3RvcnM6IENzc1NlbGVjdG9yW10gPSBDc3NTZWxlY3Rvci5wYXJzZShkaXJlY3RpdmUuc2VsZWN0b3IgISk7XG4gICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBzZWxlY3RvcnMpIHtcbiAgICAgIHJlc3VsdHMucHVzaChzZWxlY3Rvcik7XG4gICAgICBtYXAuc2V0KHNlbGVjdG9yLCBkaXJlY3RpdmUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge3NlbGVjdG9yczogcmVzdWx0cywgbWFwfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZXNjcmlwdFZlcnNpb24obG93OiBzdHJpbmcsIGhpZ2g/OiBzdHJpbmcpIHtcbiAgY29uc3QgdmVyc2lvbiA9IHRzLnZlcnNpb247XG5cbiAgaWYgKHZlcnNpb24uc3Vic3RyaW5nKDAsIGxvdy5sZW5ndGgpIDwgbG93KSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGhpZ2ggJiYgKHZlcnNpb24uc3Vic3RyaW5nKDAsIGhpZ2gubGVuZ3RoKSA+IGhpZ2gpKSByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWFnbm9zdGljSW5mb0Zyb21UZW1wbGF0ZUluZm8oaW5mbzogQXN0UmVzdWx0KTogRGlhZ25vc3RpY1RlbXBsYXRlSW5mbyB7XG4gIHJldHVybiB7XG4gICAgZmlsZU5hbWU6IGluZm8udGVtcGxhdGUuZmlsZU5hbWUsXG4gICAgb2Zmc2V0OiBpbmZvLnRlbXBsYXRlLnNwYW4uc3RhcnQsXG4gICAgcXVlcnk6IGluZm8udGVtcGxhdGUucXVlcnksXG4gICAgbWVtYmVyczogaW5mby50ZW1wbGF0ZS5tZW1iZXJzLFxuICAgIGh0bWxBc3Q6IGluZm8uaHRtbEFzdCxcbiAgICB0ZW1wbGF0ZUFzdDogaW5mby50ZW1wbGF0ZUFzdCxcbiAgICBzb3VyY2U6IGluZm8udGVtcGxhdGUuc291cmNlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZFRlbXBsYXRlQXN0QXQoYXN0OiBUZW1wbGF0ZUFzdFtdLCBwb3NpdGlvbjogbnVtYmVyKTogVGVtcGxhdGVBc3RQYXRoIHtcbiAgY29uc3QgcGF0aDogVGVtcGxhdGVBc3RbXSA9IFtdO1xuICBjb25zdCB2aXNpdG9yID0gbmV3IGNsYXNzIGV4dGVuZHMgUmVjdXJzaXZlVGVtcGxhdGVBc3RWaXNpdG9yIHtcbiAgICB2aXNpdChhc3Q6IFRlbXBsYXRlQXN0KTogYW55IHtcbiAgICAgIGxldCBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICBpZiAoaW5TcGFuKHBvc2l0aW9uLCBzcGFuKSkge1xuICAgICAgICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgICAgICAgaWYgKCFsZW4gfHwgaXNOYXJyb3dlcihzcGFuLCBzcGFuT2YocGF0aFtsZW4gLSAxXSkpKSB7XG4gICAgICAgICAgcGF0aC5wdXNoKGFzdCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJldHVybmluZyBhIHZhbHVlIGhlcmUgd2lsbCByZXN1bHQgaW4gdGhlIGNoaWxkcmVuIGJlaW5nIHNraXBwZWQuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZpc2l0RW1iZWRkZWRUZW1wbGF0ZShhc3Q6IEVtYmVkZGVkVGVtcGxhdGVBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgICByZXR1cm4gdGhpcy52aXNpdENoaWxkcmVuKGNvbnRleHQsIHZpc2l0ID0+IHtcbiAgICAgICAgLy8gSWdub3JlIHJlZmVyZW5jZSwgdmFyaWFibGUgYW5kIHByb3ZpZGVyc1xuICAgICAgICB2aXNpdChhc3QuYXR0cnMpO1xuICAgICAgICB2aXNpdChhc3QuZGlyZWN0aXZlcyk7XG4gICAgICAgIHZpc2l0KGFzdC5jaGlsZHJlbik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2aXNpdEVsZW1lbnQoYXN0OiBFbGVtZW50QXN0LCBjb250ZXh0OiBhbnkpOiBhbnkge1xuICAgICAgcmV0dXJuIHRoaXMudmlzaXRDaGlsZHJlbihjb250ZXh0LCB2aXNpdCA9PiB7XG4gICAgICAgIC8vIEluZ25vcmUgcHJvdmlkZXJzXG4gICAgICAgIHZpc2l0KGFzdC5hdHRycyk7XG4gICAgICAgIHZpc2l0KGFzdC5pbnB1dHMpO1xuICAgICAgICB2aXNpdChhc3Qub3V0cHV0cyk7XG4gICAgICAgIHZpc2l0KGFzdC5yZWZlcmVuY2VzKTtcbiAgICAgICAgdmlzaXQoYXN0LmRpcmVjdGl2ZXMpO1xuICAgICAgICB2aXNpdChhc3QuY2hpbGRyZW4pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmlzaXREaXJlY3RpdmUoYXN0OiBEaXJlY3RpdmVBc3QsIGNvbnRleHQ6IGFueSk6IGFueSB7XG4gICAgICAvLyBJZ25vcmUgdGhlIGhvc3QgcHJvcGVydGllcyBvZiBhIGRpcmVjdGl2ZVxuICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy52aXNpdENoaWxkcmVuKGNvbnRleHQsIHZpc2l0ID0+IHsgdmlzaXQoYXN0LmlucHV0cyk7IH0pO1xuICAgICAgLy8gV2UgbmV2ZXIgY2FyZSBhYm91dCB0aGUgZGlyZXRpdmUgaXRzZWxmLCBqdXN0IGl0cyBpbnB1dHMuXG4gICAgICBpZiAocGF0aFtwYXRoLmxlbmd0aCAtIDFdID09PSBhc3QpIHtcbiAgICAgICAgcGF0aC5wb3AoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9O1xuXG4gIHRlbXBsYXRlVmlzaXRBbGwodmlzaXRvciwgYXN0KTtcblxuICByZXR1cm4gbmV3IEFzdFBhdGg8VGVtcGxhdGVBc3Q+KHBhdGgsIHBvc2l0aW9uKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5vZGUgdGhhdCBtb3N0IHRpZ2h0bHkgZW5jb21wYXNzIHRoZSBzcGVjaWZpZWQgYHBvc2l0aW9uYC5cbiAqIEBwYXJhbSBub2RlXG4gKiBAcGFyYW0gcG9zaXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRUaWdodGVzdE5vZGUobm9kZTogdHMuTm9kZSwgcG9zaXRpb246IG51bWJlcik6IHRzLk5vZGV8dW5kZWZpbmVkIHtcbiAgaWYgKG5vZGUuZ2V0U3RhcnQoKSA8PSBwb3NpdGlvbiAmJiBwb3NpdGlvbiA8IG5vZGUuZ2V0RW5kKCkpIHtcbiAgICByZXR1cm4gbm9kZS5mb3JFYWNoQ2hpbGQoYyA9PiBmaW5kVGlnaHRlc3ROb2RlKGMsIHBvc2l0aW9uKSkgfHwgbm9kZTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgRGlyZWN0aXZlQ2xhc3NMaWtlIHtcbiAgZGVjb3JhdG9ySWQ6IHRzLklkZW50aWZpZXI7ICAvLyBkZWNvcmF0b3IgaWRlbnRpZmllciwgbGlrZSBAQ29tcG9uZW50XG4gIGNsYXNzSWQ6IHRzLklkZW50aWZpZXI7XG59XG5cbi8qKlxuICogUmV0dXJuIG1ldGFkYXRhIGFib3V0IGBub2RlYCBpZiBpdCBsb29rcyBsaWtlIGFuIEFuZ3VsYXIgZGlyZWN0aXZlIGNsYXNzLlxuICogSW4gdGhpcyBjYXNlLCBwb3RlbnRpYWwgbWF0Y2hlcyBhcmUgYEBOZ01vZHVsZWAsIGBAQ29tcG9uZW50YCwgYEBEaXJlY3RpdmVgLFxuICogYEBQaXBlYCwgZXRjLlxuICogVGhlc2UgY2xhc3MgZGVjbGFyYXRpb25zIGFsbCBzaGFyZSBzb21lIGNvbW1vbiBhdHRyaWJ1dGVzLCBuYW1lbHkgdGhlaXJcbiAqIGRlY29yYXRvciB0YWtlcyBleGFjdGx5IG9uZSBwYXJhbWV0ZXIgYW5kIHRoZSBwYXJhbWV0ZXIgbXVzdCBiZSBhbiBvYmplY3RcbiAqIGxpdGVyYWwuXG4gKlxuICogRm9yIGV4YW1wbGUsXG4gKiAgICAgdi0tLS0tLS0tLS0gYGRlY29yYXRvcklkYFxuICogQE5nTW9kdWxlKHsgICAgICAgICAgIDxcbiAqICAgZGVjbGFyYXRpb25zOiBbXSwgICA8IGNsYXNzRGVjbFxuICogfSkgICAgICAgICAgICAgICAgICAgIDxcbiAqIGNsYXNzIEFwcE1vZHVsZSB7fSAgICA8XG4gKiAgICAgICAgICBeLS0tLS0gYGNsYXNzSWRgXG4gKlxuICogQHBhcmFtIG5vZGUgUG90ZW50aWFsIG5vZGUgdGhhdCByZXByZXNlbnRzIGFuIEFuZ3VsYXIgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlQ2xhc3NMaWtlKG5vZGU6IHRzLk5vZGUpOiBEaXJlY3RpdmVDbGFzc0xpa2V8dW5kZWZpbmVkIHtcbiAgaWYgKCF0cy5pc0NsYXNzRGVjbGFyYXRpb24obm9kZSkgfHwgIW5vZGUubmFtZSB8fCAhbm9kZS5kZWNvcmF0b3JzKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgZCBvZiBub2RlLmRlY29yYXRvcnMpIHtcbiAgICBjb25zdCBleHByID0gZC5leHByZXNzaW9uO1xuICAgIGlmICghdHMuaXNDYWxsRXhwcmVzc2lvbihleHByKSB8fCBleHByLmFyZ3VtZW50cy5sZW5ndGggIT09IDEgfHxcbiAgICAgICAgIXRzLmlzSWRlbnRpZmllcihleHByLmV4cHJlc3Npb24pKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgYXJnID0gZXhwci5hcmd1bWVudHNbMF07XG4gICAgaWYgKHRzLmlzT2JqZWN0TGl0ZXJhbEV4cHJlc3Npb24oYXJnKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZGVjb3JhdG9ySWQ6IGV4cHIuZXhwcmVzc2lvbixcbiAgICAgICAgY2xhc3NJZDogbm9kZS5uYW1lLFxuICAgICAgfTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBhc3NpZ25tZW50IHRoYXQgaXMgbmVzdGVkIGluIGEgVHlwZVNjcmlwdCBub2RlIGFuZCBpcyBvZiBhIGNlcnRhaW5cbiAqIHR5cGUgVC5cbiAqXG4gKiBAcGFyYW0gc3RhcnROb2RlIG5vZGUgdG8gc3RhcnQgc2VhcmNoaW5nIGZvciBuZXN0ZWQgcHJvcGVydHkgYXNzaWdubWVudCBmcm9tXG4gKiBAcGFyYW0gcHJvcE5hbWUgcHJvcGVydHkgYXNzaWdubWVudCBuYW1lXG4gKiBAcGFyYW0gcHJlZGljYXRlIGZ1bmN0aW9uIHRvIHZlcmlmeSB0aGF0IGEgbm9kZSBpcyBvZiB0eXBlIFQuXG4gKiBAcmV0dXJuIG5vZGUgcHJvcGVydHkgYXNzaWdubWVudCB2YWx1ZSBvZiB0eXBlIFQsIG9yIHVuZGVmaW5lZCBpZiBub25lIGlzIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kUHJvcGVydHlWYWx1ZU9mVHlwZTxUIGV4dGVuZHMgdHMuTm9kZT4oXG4gICAgc3RhcnROb2RlOiB0cy5Ob2RlLCBwcm9wTmFtZTogc3RyaW5nLCBwcmVkaWNhdGU6IChub2RlOiB0cy5Ob2RlKSA9PiBub2RlIGlzIFQpOiBUfHVuZGVmaW5lZCB7XG4gIGlmICh0cy5pc1Byb3BlcnR5QXNzaWdubWVudChzdGFydE5vZGUpICYmIHN0YXJ0Tm9kZS5uYW1lLmdldFRleHQoKSA9PT0gcHJvcE5hbWUpIHtcbiAgICBjb25zdCB7aW5pdGlhbGl6ZXJ9ID0gc3RhcnROb2RlO1xuICAgIGlmIChwcmVkaWNhdGUoaW5pdGlhbGl6ZXIpKSByZXR1cm4gaW5pdGlhbGl6ZXI7XG4gIH1cbiAgcmV0dXJuIHN0YXJ0Tm9kZS5mb3JFYWNoQ2hpbGQoYyA9PiBmaW5kUHJvcGVydHlWYWx1ZU9mVHlwZShjLCBwcm9wTmFtZSwgcHJlZGljYXRlKSk7XG59XG5cbi8qKlxuICogRmluZCB0aGUgdGlnaHRlc3Qgbm9kZSBhdCB0aGUgc3BlY2lmaWVkIGBwb3NpdGlvbmAgZnJvbSB0aGUgQVNUIGBub2Rlc2AsIGFuZFxuICogcmV0dXJuIHRoZSBwYXRoIHRvIHRoZSBub2RlLlxuICogQHBhcmFtIG5vZGVzIEhUTUwgQVNUIG5vZGVzXG4gKiBAcGFyYW0gcG9zaXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhdGhUb05vZGVBdFBvc2l0aW9uKG5vZGVzOiBOb2RlW10sIHBvc2l0aW9uOiBudW1iZXIpOiBIdG1sQXN0UGF0aCB7XG4gIGNvbnN0IHBhdGg6IE5vZGVbXSA9IFtdO1xuICBjb25zdCB2aXNpdG9yID0gbmV3IGNsYXNzIGV4dGVuZHMgUmVjdXJzaXZlVmlzaXRvciB7XG4gICAgdmlzaXQoYXN0OiBOb2RlKSB7XG4gICAgICBjb25zdCBzcGFuID0gc3Bhbk9mKGFzdCk7XG4gICAgICBpZiAoaW5TcGFuKHBvc2l0aW9uLCBzcGFuKSkge1xuICAgICAgICBwYXRoLnB1c2goYXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJldHVybmluZyBhIHRydXRoeSB2YWx1ZSBoZXJlIHdpbGwgc2tpcCBhbGwgY2hpbGRyZW4gYW5kIHRlcm1pbmF0ZVxuICAgICAgICAvLyB0aGUgdmlzaXQuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgdmlzaXRBbGwodmlzaXRvciwgbm9kZXMpO1xuICByZXR1cm4gbmV3IEFzdFBhdGg8Tm9kZT4ocGF0aCwgcG9zaXRpb24pO1xufVxuXG5cbi8qKlxuICogSW52ZXJ0cyBhbiBvYmplY3QncyBrZXktdmFsdWUgcGFpcnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZlcnRNYXAob2JqOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30pOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30ge1xuICBjb25zdCByZXN1bHQ6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXMob2JqKSkge1xuICAgIGNvbnN0IHYgPSBvYmpbbmFtZV07XG4gICAgcmVzdWx0W3ZdID0gbmFtZTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbi8qKlxuICogRmluZHMgdGhlIGRpcmVjdGl2ZSBtZW1iZXIgcHJvdmlkaW5nIGEgdGVtcGxhdGUgb3V0cHV0IGJpbmRpbmcsIGlmIG9uZSBleGlzdHMuXG4gKiBAcGFyYW0gaW5mbyBhZ2dyZWdhdGUgdGVtcGxhdGUgQVNUIGluZm9ybWF0aW9uXG4gKiBAcGFyYW0gcGF0aCBuYXJyb3dpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRPdXRwdXRCaW5kaW5nKFxuICAgIGJpbmRpbmc6IEJvdW5kRXZlbnRBc3QsIHBhdGg6IFRlbXBsYXRlQXN0UGF0aCwgcXVlcnk6IFN5bWJvbFF1ZXJ5KTogU3ltYm9sfHVuZGVmaW5lZCB7XG4gIGNvbnN0IGVsZW1lbnQgPSBwYXRoLmZpcnN0KEVsZW1lbnRBc3QpO1xuICBpZiAoZWxlbWVudCkge1xuICAgIGZvciAoY29uc3QgZGlyZWN0aXZlIG9mIGVsZW1lbnQuZGlyZWN0aXZlcykge1xuICAgICAgY29uc3QgaW52ZXJ0ZWRPdXRwdXRzID0gaW52ZXJ0TWFwKGRpcmVjdGl2ZS5kaXJlY3RpdmUub3V0cHV0cyk7XG4gICAgICBjb25zdCBmaWVsZE5hbWUgPSBpbnZlcnRlZE91dHB1dHNbYmluZGluZy5uYW1lXTtcbiAgICAgIGlmIChmaWVsZE5hbWUpIHtcbiAgICAgICAgY29uc3QgY2xhc3NTeW1ib2wgPSBxdWVyeS5nZXRUeXBlU3ltYm9sKGRpcmVjdGl2ZS5kaXJlY3RpdmUudHlwZS5yZWZlcmVuY2UpO1xuICAgICAgICBpZiAoY2xhc3NTeW1ib2wpIHtcbiAgICAgICAgICByZXR1cm4gY2xhc3NTeW1ib2wubWVtYmVycygpLmdldChmaWVsZE5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=