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
        define("@angular/language-service/src/expressions", ["require", "exports", "tslib", "@angular/compiler", "@angular/language-service/src/expression_type", "@angular/language-service/src/types", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var compiler_1 = require("@angular/compiler");
    var expression_type_1 = require("@angular/language-service/src/expression_type");
    var types_1 = require("@angular/language-service/src/types");
    var utils_1 = require("@angular/language-service/src/utils");
    function findAstAt(ast, position, excludeEmpty) {
        if (excludeEmpty === void 0) { excludeEmpty = false; }
        var path = [];
        var visitor = new /** @class */ (function (_super) {
            tslib_1.__extends(class_1, _super);
            function class_1() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            class_1.prototype.visit = function (ast) {
                if ((!excludeEmpty || ast.sourceSpan.start < ast.sourceSpan.end) &&
                    utils_1.inSpan(position, ast.sourceSpan)) {
                    path.push(ast);
                    ast.visit(this);
                }
            };
            return class_1;
        }(compiler_1.RecursiveAstVisitor));
        // We never care about the ASTWithSource node and its visit() method calls its ast's visit so
        // the visit() method above would never see it.
        if (ast instanceof compiler_1.ASTWithSource) {
            ast = ast.ast;
        }
        visitor.visit(ast);
        return new compiler_1.AstPath(path, position);
    }
    function getExpressionCompletions(scope, ast, position, templateInfo) {
        var path = findAstAt(ast, position);
        if (path.empty)
            return undefined;
        var tail = path.tail;
        var result = scope;
        function getType(ast) {
            return new expression_type_1.AstType(scope, templateInfo.query, {}, templateInfo.source).getType(ast);
        }
        // If the completion request is in a not in a pipe or property access then the global scope
        // (that is the scope of the implicit receiver) is the right scope as the user is typing the
        // beginning of an expression.
        tail.visit({
            visitBinary: function (ast) { },
            visitChain: function (ast) { },
            visitConditional: function (ast) { },
            visitFunctionCall: function (ast) { },
            visitImplicitReceiver: function (ast) { },
            visitInterpolation: function (ast) { result = undefined; },
            visitKeyedRead: function (ast) { },
            visitKeyedWrite: function (ast) { },
            visitLiteralArray: function (ast) { },
            visitLiteralMap: function (ast) { },
            visitLiteralPrimitive: function (ast) { },
            visitMethodCall: function (ast) { },
            visitPipe: function (ast) {
                if (position >= ast.exp.span.end &&
                    (!ast.args || !ast.args.length || position < ast.args[0].span.start)) {
                    // We are in a position a pipe name is expected.
                    result = templateInfo.query.getPipes();
                }
            },
            visitPrefixNot: function (ast) { },
            visitNonNullAssert: function (ast) { },
            visitPropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
            visitPropertyWrite: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
            visitQuote: function (ast) {
                // For a quote, return the members of any (if there are any).
                result = templateInfo.query.getBuiltinType(types_1.BuiltinType.Any).members();
            },
            visitSafeMethodCall: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
            visitSafePropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                result = receiverType ? receiverType.members() : scope;
            },
        });
        return result && result.values();
    }
    exports.getExpressionCompletions = getExpressionCompletions;
    /**
     * Retrieves the expression symbol at a particular position in a template.
     *
     * @param scope symbols in scope of the template
     * @param ast template AST
     * @param position absolute location in template to retrieve symbol at
     * @param query type symbol query for the template scope
     */
    function getExpressionSymbol(scope, ast, position, templateInfo) {
        var path = findAstAt(ast, position, /* excludeEmpty */ true);
        if (path.empty)
            return undefined;
        var tail = path.tail;
        function getType(ast) {
            return new expression_type_1.AstType(scope, templateInfo.query, {}, templateInfo.source).getType(ast);
        }
        var symbol = undefined;
        var span = undefined;
        // If the completion request is in a not in a pipe or property access then the global scope
        // (that is the scope of the implicit receiver) is the right scope as the user is typing the
        // beginning of an expression.
        tail.visit({
            visitBinary: function (ast) { },
            visitChain: function (ast) { },
            visitConditional: function (ast) { },
            visitFunctionCall: function (ast) { },
            visitImplicitReceiver: function (ast) { },
            visitInterpolation: function (ast) { },
            visitKeyedRead: function (ast) { },
            visitKeyedWrite: function (ast) { },
            visitLiteralArray: function (ast) { },
            visitLiteralMap: function (ast) { },
            visitLiteralPrimitive: function (ast) { },
            visitMethodCall: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
            visitPipe: function (ast) {
                if (utils_1.inSpan(position, ast.nameSpan, /* exclusive */ true)) {
                    // We are in a position a pipe name is expected.
                    var pipes = templateInfo.query.getPipes();
                    symbol = pipes.get(ast.name);
                    // `nameSpan` is an absolute span, but the span expected by the result of this method is
                    // relative to the start of the expression.
                    // TODO(ayazhafiz): migrate to only using absolute spans
                    var offset = ast.sourceSpan.start - ast.span.start;
                    span = {
                        start: ast.nameSpan.start - offset,
                        end: ast.nameSpan.end - offset,
                    };
                }
            },
            visitPrefixNot: function (ast) { },
            visitNonNullAssert: function (ast) { },
            visitPropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
            visitPropertyWrite: function (ast) {
                var receiverType = getType(ast.receiver);
                var start = ast.span.start;
                symbol = receiverType && receiverType.members().get(ast.name);
                // A PropertyWrite span includes both the LHS (name) and the RHS (value) of the write. In this
                // visit, only the name is relevant.
                //   prop=$event
                //   ^^^^        name
                //        ^^^^^^ value; visited separately as a nested AST
                span = { start: start, end: start + ast.name.length };
            },
            visitQuote: function (ast) { },
            visitSafeMethodCall: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
            visitSafePropertyRead: function (ast) {
                var receiverType = getType(ast.receiver);
                symbol = receiverType && receiverType.members().get(ast.name);
                span = ast.span;
            },
        });
        if (symbol && span) {
            return { symbol: symbol, span: span };
        }
    }
    exports.getExpressionSymbol = getExpressionSymbol;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9leHByZXNzaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCw4Q0FBa0c7SUFDbEcsaUZBQTBDO0lBQzFDLDZEQUErRTtJQUMvRSw2REFBK0I7SUFJL0IsU0FBUyxTQUFTLENBQUMsR0FBUSxFQUFFLFFBQWdCLEVBQUUsWUFBNkI7UUFBN0IsNkJBQUEsRUFBQSxvQkFBNkI7UUFDMUUsSUFBTSxJQUFJLEdBQVUsRUFBRSxDQUFDO1FBQ3ZCLElBQU0sT0FBTyxHQUFHO1lBQWtCLG1DQUFtQjtZQUFqQzs7WUFRcEIsQ0FBQztZQVBDLHVCQUFLLEdBQUwsVUFBTSxHQUFRO2dCQUNaLElBQUksQ0FBQyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztvQkFDNUQsY0FBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2YsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakI7WUFDSCxDQUFDO1lBQ0gsY0FBQztRQUFELENBQUMsQUFSbUIsQ0FBYyw4QkFBbUIsRUFRcEQsQ0FBQztRQUVGLDZGQUE2RjtRQUM3RiwrQ0FBK0M7UUFDL0MsSUFBSSxHQUFHLFlBQVksd0JBQWEsRUFBRTtZQUNoQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztTQUNmO1FBRUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVuQixPQUFPLElBQUksa0JBQVcsQ0FBTSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUMs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RyxZQUFZLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzlELElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2xCLENBQUM7WUFDRCxxQkFBcUIsWUFBQyxHQUFHO2dCQUN2QixJQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLEdBQUcsWUFBWSxJQUFJLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNsQixDQUFDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO1lBQ2xCLE9BQU8sRUFBQyxNQUFNLFFBQUEsRUFBRSxJQUFJLE1BQUEsRUFBQyxDQUFDO1NBQ3ZCO0lBQ0gsQ0FBQztJQXBGRCxrREFvRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVNULCBBU1RXaXRoU291cmNlLCBBc3RQYXRoIGFzIEFzdFBhdGhCYXNlLCBSZWN1cnNpdmVBc3RWaXNpdG9yfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0FzdFR5cGV9IGZyb20gJy4vZXhwcmVzc2lvbl90eXBlJztcbmltcG9ydCB7QnVpbHRpblR5cGUsIFNwYW4sIFN5bWJvbCwgU3ltYm9sVGFibGUsIFRlbXBsYXRlU291cmNlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7aW5TcGFufSBmcm9tICcuL3V0aWxzJztcblxudHlwZSBBc3RQYXRoID0gQXN0UGF0aEJhc2U8QVNUPjtcblxuZnVuY3Rpb24gZmluZEFzdEF0KGFzdDogQVNULCBwb3NpdGlvbjogbnVtYmVyLCBleGNsdWRlRW1wdHk6IGJvb2xlYW4gPSBmYWxzZSk6IEFzdFBhdGgge1xuICBjb25zdCBwYXRoOiBBU1RbXSA9IFtdO1xuICBjb25zdCB2aXNpdG9yID0gbmV3IGNsYXNzIGV4dGVuZHMgUmVjdXJzaXZlQXN0VmlzaXRvciB7XG4gICAgdmlzaXQoYXN0OiBBU1QpIHtcbiAgICAgIGlmICgoIWV4Y2x1ZGVFbXB0eSB8fCBhc3Quc291cmNlU3Bhbi5zdGFydCA8IGFzdC5zb3VyY2VTcGFuLmVuZCkgJiZcbiAgICAgICAgICBpblNwYW4ocG9zaXRpb24sIGFzdC5zb3VyY2VTcGFuKSkge1xuICAgICAgICBwYXRoLnB1c2goYXN0KTtcbiAgICAgICAgYXN0LnZpc2l0KHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBXZSBuZXZlciBjYXJlIGFib3V0IHRoZSBBU1RXaXRoU291cmNlIG5vZGUgYW5kIGl0cyB2aXNpdCgpIG1ldGhvZCBjYWxscyBpdHMgYXN0J3MgdmlzaXQgc29cbiAgLy8gdGhlIHZpc2l0KCkgbWV0aG9kIGFib3ZlIHdvdWxkIG5ldmVyIHNlZSBpdC5cbiAgaWYgKGFzdCBpbnN0YW5jZW9mIEFTVFdpdGhTb3VyY2UpIHtcbiAgICBhc3QgPSBhc3QuYXN0O1xuICB9XG5cbiAgdmlzaXRvci52aXNpdChhc3QpO1xuXG4gIHJldHVybiBuZXcgQXN0UGF0aEJhc2U8QVNUPihwYXRoLCBwb3NpdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHByZXNzaW9uQ29tcGxldGlvbnMoXG4gICAgc2NvcGU6IFN5bWJvbFRhYmxlLCBhc3Q6IEFTVCwgcG9zaXRpb246IG51bWJlciwgdGVtcGxhdGVJbmZvOiBUZW1wbGF0ZVNvdXJjZSk6IFN5bWJvbFtdfFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IHBhdGggPSBmaW5kQXN0QXQoYXN0LCBwb3NpdGlvbik7XG4gIGlmIChwYXRoLmVtcHR5KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB0YWlsID0gcGF0aC50YWlsICE7XG4gIGxldCByZXN1bHQ6IFN5bWJvbFRhYmxlfHVuZGVmaW5lZCA9IHNjb3BlO1xuXG4gIGZ1bmN0aW9uIGdldFR5cGUoYXN0OiBBU1QpOiBTeW1ib2wge1xuICAgIHJldHVybiBuZXcgQXN0VHlwZShzY29wZSwgdGVtcGxhdGVJbmZvLnF1ZXJ5LCB7fSwgdGVtcGxhdGVJbmZvLnNvdXJjZSkuZ2V0VHlwZShhc3QpO1xuICB9XG5cbiAgLy8gSWYgdGhlIGNvbXBsZXRpb24gcmVxdWVzdCBpcyBpbiBhIG5vdCBpbiBhIHBpcGUgb3IgcHJvcGVydHkgYWNjZXNzIHRoZW4gdGhlIGdsb2JhbCBzY29wZVxuICAvLyAodGhhdCBpcyB0aGUgc2NvcGUgb2YgdGhlIGltcGxpY2l0IHJlY2VpdmVyKSBpcyB0aGUgcmlnaHQgc2NvcGUgYXMgdGhlIHVzZXIgaXMgdHlwaW5nIHRoZVxuICAvLyBiZWdpbm5pbmcgb2YgYW4gZXhwcmVzc2lvbi5cbiAgdGFpbC52aXNpdCh7XG4gICAgdmlzaXRCaW5hcnkoYXN0KSB7fSxcbiAgICB2aXNpdENoYWluKGFzdCkge30sXG4gICAgdmlzaXRDb25kaXRpb25hbChhc3QpIHt9LFxuICAgIHZpc2l0RnVuY3Rpb25DYWxsKGFzdCkge30sXG4gICAgdmlzaXRJbXBsaWNpdFJlY2VpdmVyKGFzdCkge30sXG4gICAgdmlzaXRJbnRlcnBvbGF0aW9uKGFzdCkgeyByZXN1bHQgPSB1bmRlZmluZWQ7IH0sXG4gICAgdmlzaXRLZXllZFJlYWQoYXN0KSB7fSxcbiAgICB2aXNpdEtleWVkV3JpdGUoYXN0KSB7fSxcbiAgICB2aXNpdExpdGVyYWxBcnJheShhc3QpIHt9LFxuICAgIHZpc2l0TGl0ZXJhbE1hcChhc3QpIHt9LFxuICAgIHZpc2l0TGl0ZXJhbFByaW1pdGl2ZShhc3QpIHt9LFxuICAgIHZpc2l0TWV0aG9kQ2FsbChhc3QpIHt9LFxuICAgIHZpc2l0UGlwZShhc3QpIHtcbiAgICAgIGlmIChwb3NpdGlvbiA+PSBhc3QuZXhwLnNwYW4uZW5kICYmXG4gICAgICAgICAgKCFhc3QuYXJncyB8fCAhYXN0LmFyZ3MubGVuZ3RoIHx8IHBvc2l0aW9uIDwgKDxBU1Q+YXN0LmFyZ3NbMF0pLnNwYW4uc3RhcnQpKSB7XG4gICAgICAgIC8vIFdlIGFyZSBpbiBhIHBvc2l0aW9uIGEgcGlwZSBuYW1lIGlzIGV4cGVjdGVkLlxuICAgICAgICByZXN1bHQgPSB0ZW1wbGF0ZUluZm8ucXVlcnkuZ2V0UGlwZXMoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHZpc2l0UHJlZml4Tm90KGFzdCkge30sXG4gICAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdCkge30sXG4gICAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0KSB7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBnZXRUeXBlKGFzdC5yZWNlaXZlcik7XG4gICAgICByZXN1bHQgPSByZWNlaXZlclR5cGUgPyByZWNlaXZlclR5cGUubWVtYmVycygpIDogc2NvcGU7XG4gICAgfSxcbiAgICB2aXNpdFByb3BlcnR5V3JpdGUoYXN0KSB7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBnZXRUeXBlKGFzdC5yZWNlaXZlcik7XG4gICAgICByZXN1bHQgPSByZWNlaXZlclR5cGUgPyByZWNlaXZlclR5cGUubWVtYmVycygpIDogc2NvcGU7XG4gICAgfSxcbiAgICB2aXNpdFF1b3RlKGFzdCkge1xuICAgICAgLy8gRm9yIGEgcXVvdGUsIHJldHVybiB0aGUgbWVtYmVycyBvZiBhbnkgKGlmIHRoZXJlIGFyZSBhbnkpLlxuICAgICAgcmVzdWx0ID0gdGVtcGxhdGVJbmZvLnF1ZXJ5LmdldEJ1aWx0aW5UeXBlKEJ1aWx0aW5UeXBlLkFueSkubWVtYmVycygpO1xuICAgIH0sXG4gICAgdmlzaXRTYWZlTWV0aG9kQ2FsbChhc3QpIHtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IGdldFR5cGUoYXN0LnJlY2VpdmVyKTtcbiAgICAgIHJlc3VsdCA9IHJlY2VpdmVyVHlwZSA/IHJlY2VpdmVyVHlwZS5tZW1iZXJzKCkgOiBzY29wZTtcbiAgICB9LFxuICAgIHZpc2l0U2FmZVByb3BlcnR5UmVhZChhc3QpIHtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IGdldFR5cGUoYXN0LnJlY2VpdmVyKTtcbiAgICAgIHJlc3VsdCA9IHJlY2VpdmVyVHlwZSA/IHJlY2VpdmVyVHlwZS5tZW1iZXJzKCkgOiBzY29wZTtcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gcmVzdWx0ICYmIHJlc3VsdC52YWx1ZXMoKTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGV4cHJlc3Npb24gc3ltYm9sIGF0IGEgcGFydGljdWxhciBwb3NpdGlvbiBpbiBhIHRlbXBsYXRlLlxuICpcbiAqIEBwYXJhbSBzY29wZSBzeW1ib2xzIGluIHNjb3BlIG9mIHRoZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGFzdCB0ZW1wbGF0ZSBBU1RcbiAqIEBwYXJhbSBwb3NpdGlvbiBhYnNvbHV0ZSBsb2NhdGlvbiBpbiB0ZW1wbGF0ZSB0byByZXRyaWV2ZSBzeW1ib2wgYXRcbiAqIEBwYXJhbSBxdWVyeSB0eXBlIHN5bWJvbCBxdWVyeSBmb3IgdGhlIHRlbXBsYXRlIHNjb3BlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHByZXNzaW9uU3ltYm9sKFxuICAgIHNjb3BlOiBTeW1ib2xUYWJsZSwgYXN0OiBBU1QsIHBvc2l0aW9uOiBudW1iZXIsXG4gICAgdGVtcGxhdGVJbmZvOiBUZW1wbGF0ZVNvdXJjZSk6IHtzeW1ib2w6IFN5bWJvbCwgc3BhbjogU3Bhbn18dW5kZWZpbmVkIHtcbiAgY29uc3QgcGF0aCA9IGZpbmRBc3RBdChhc3QsIHBvc2l0aW9uLCAvKiBleGNsdWRlRW1wdHkgKi8gdHJ1ZSk7XG4gIGlmIChwYXRoLmVtcHR5KSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB0YWlsID0gcGF0aC50YWlsICE7XG5cbiAgZnVuY3Rpb24gZ2V0VHlwZShhc3Q6IEFTVCk6IFN5bWJvbCB7XG4gICAgcmV0dXJuIG5ldyBBc3RUeXBlKHNjb3BlLCB0ZW1wbGF0ZUluZm8ucXVlcnksIHt9LCB0ZW1wbGF0ZUluZm8uc291cmNlKS5nZXRUeXBlKGFzdCk7XG4gIH1cblxuICBsZXQgc3ltYm9sOiBTeW1ib2x8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgc3BhbjogU3Bhbnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gSWYgdGhlIGNvbXBsZXRpb24gcmVxdWVzdCBpcyBpbiBhIG5vdCBpbiBhIHBpcGUgb3IgcHJvcGVydHkgYWNjZXNzIHRoZW4gdGhlIGdsb2JhbCBzY29wZVxuICAvLyAodGhhdCBpcyB0aGUgc2NvcGUgb2YgdGhlIGltcGxpY2l0IHJlY2VpdmVyKSBpcyB0aGUgcmlnaHQgc2NvcGUgYXMgdGhlIHVzZXIgaXMgdHlwaW5nIHRoZVxuICAvLyBiZWdpbm5pbmcgb2YgYW4gZXhwcmVzc2lvbi5cbiAgdGFpbC52aXNpdCh7XG4gICAgdmlzaXRCaW5hcnkoYXN0KSB7fSxcbiAgICB2aXNpdENoYWluKGFzdCkge30sXG4gICAgdmlzaXRDb25kaXRpb25hbChhc3QpIHt9LFxuICAgIHZpc2l0RnVuY3Rpb25DYWxsKGFzdCkge30sXG4gICAgdmlzaXRJbXBsaWNpdFJlY2VpdmVyKGFzdCkge30sXG4gICAgdmlzaXRJbnRlcnBvbGF0aW9uKGFzdCkge30sXG4gICAgdmlzaXRLZXllZFJlYWQoYXN0KSB7fSxcbiAgICB2aXNpdEtleWVkV3JpdGUoYXN0KSB7fSxcbiAgICB2aXNpdExpdGVyYWxBcnJheShhc3QpIHt9LFxuICAgIHZpc2l0TGl0ZXJhbE1hcChhc3QpIHt9LFxuICAgIHZpc2l0TGl0ZXJhbFByaW1pdGl2ZShhc3QpIHt9LFxuICAgIHZpc2l0TWV0aG9kQ2FsbChhc3QpIHtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IGdldFR5cGUoYXN0LnJlY2VpdmVyKTtcbiAgICAgIHN5bWJvbCA9IHJlY2VpdmVyVHlwZSAmJiByZWNlaXZlclR5cGUubWVtYmVycygpLmdldChhc3QubmFtZSk7XG4gICAgICBzcGFuID0gYXN0LnNwYW47XG4gICAgfSxcbiAgICB2aXNpdFBpcGUoYXN0KSB7XG4gICAgICBpZiAoaW5TcGFuKHBvc2l0aW9uLCBhc3QubmFtZVNwYW4sIC8qIGV4Y2x1c2l2ZSAqLyB0cnVlKSkge1xuICAgICAgICAvLyBXZSBhcmUgaW4gYSBwb3NpdGlvbiBhIHBpcGUgbmFtZSBpcyBleHBlY3RlZC5cbiAgICAgICAgY29uc3QgcGlwZXMgPSB0ZW1wbGF0ZUluZm8ucXVlcnkuZ2V0UGlwZXMoKTtcbiAgICAgICAgc3ltYm9sID0gcGlwZXMuZ2V0KGFzdC5uYW1lKTtcblxuICAgICAgICAvLyBgbmFtZVNwYW5gIGlzIGFuIGFic29sdXRlIHNwYW4sIGJ1dCB0aGUgc3BhbiBleHBlY3RlZCBieSB0aGUgcmVzdWx0IG9mIHRoaXMgbWV0aG9kIGlzXG4gICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBzdGFydCBvZiB0aGUgZXhwcmVzc2lvbi5cbiAgICAgICAgLy8gVE9ETyhheWF6aGFmaXopOiBtaWdyYXRlIHRvIG9ubHkgdXNpbmcgYWJzb2x1dGUgc3BhbnNcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gYXN0LnNvdXJjZVNwYW4uc3RhcnQgLSBhc3Quc3Bhbi5zdGFydDtcbiAgICAgICAgc3BhbiA9IHtcbiAgICAgICAgICBzdGFydDogYXN0Lm5hbWVTcGFuLnN0YXJ0IC0gb2Zmc2V0LFxuICAgICAgICAgIGVuZDogYXN0Lm5hbWVTcGFuLmVuZCAtIG9mZnNldCxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHZpc2l0UHJlZml4Tm90KGFzdCkge30sXG4gICAgdmlzaXROb25OdWxsQXNzZXJ0KGFzdCkge30sXG4gICAgdmlzaXRQcm9wZXJ0eVJlYWQoYXN0KSB7XG4gICAgICBjb25zdCByZWNlaXZlclR5cGUgPSBnZXRUeXBlKGFzdC5yZWNlaXZlcik7XG4gICAgICBzeW1ib2wgPSByZWNlaXZlclR5cGUgJiYgcmVjZWl2ZXJUeXBlLm1lbWJlcnMoKS5nZXQoYXN0Lm5hbWUpO1xuICAgICAgc3BhbiA9IGFzdC5zcGFuO1xuICAgIH0sXG4gICAgdmlzaXRQcm9wZXJ0eVdyaXRlKGFzdCkge1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gZ2V0VHlwZShhc3QucmVjZWl2ZXIpO1xuICAgICAgY29uc3Qge3N0YXJ0fSA9IGFzdC5zcGFuO1xuICAgICAgc3ltYm9sID0gcmVjZWl2ZXJUeXBlICYmIHJlY2VpdmVyVHlwZS5tZW1iZXJzKCkuZ2V0KGFzdC5uYW1lKTtcbiAgICAgIC8vIEEgUHJvcGVydHlXcml0ZSBzcGFuIGluY2x1ZGVzIGJvdGggdGhlIExIUyAobmFtZSkgYW5kIHRoZSBSSFMgKHZhbHVlKSBvZiB0aGUgd3JpdGUuIEluIHRoaXNcbiAgICAgIC8vIHZpc2l0LCBvbmx5IHRoZSBuYW1lIGlzIHJlbGV2YW50LlxuICAgICAgLy8gICBwcm9wPSRldmVudFxuICAgICAgLy8gICBeXl5eICAgICAgICBuYW1lXG4gICAgICAvLyAgICAgICAgXl5eXl5eIHZhbHVlOyB2aXNpdGVkIHNlcGFyYXRlbHkgYXMgYSBuZXN0ZWQgQVNUXG4gICAgICBzcGFuID0ge3N0YXJ0LCBlbmQ6IHN0YXJ0ICsgYXN0Lm5hbWUubGVuZ3RofTtcbiAgICB9LFxuICAgIHZpc2l0UXVvdGUoYXN0KSB7fSxcbiAgICB2aXNpdFNhZmVNZXRob2RDYWxsKGFzdCkge1xuICAgICAgY29uc3QgcmVjZWl2ZXJUeXBlID0gZ2V0VHlwZShhc3QucmVjZWl2ZXIpO1xuICAgICAgc3ltYm9sID0gcmVjZWl2ZXJUeXBlICYmIHJlY2VpdmVyVHlwZS5tZW1iZXJzKCkuZ2V0KGFzdC5uYW1lKTtcbiAgICAgIHNwYW4gPSBhc3Quc3BhbjtcbiAgICB9LFxuICAgIHZpc2l0U2FmZVByb3BlcnR5UmVhZChhc3QpIHtcbiAgICAgIGNvbnN0IHJlY2VpdmVyVHlwZSA9IGdldFR5cGUoYXN0LnJlY2VpdmVyKTtcbiAgICAgIHN5bWJvbCA9IHJlY2VpdmVyVHlwZSAmJiByZWNlaXZlclR5cGUubWVtYmVycygpLmdldChhc3QubmFtZSk7XG4gICAgICBzcGFuID0gYXN0LnNwYW47XG4gICAgfSxcbiAgfSk7XG5cbiAgaWYgKHN5bWJvbCAmJiBzcGFuKSB7XG4gICAgcmV0dXJuIHtzeW1ib2wsIHNwYW59O1xuICB9XG59XG4iXX0=