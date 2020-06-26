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
        define("@angular/language-service/src/diagnostics", ["require", "exports", "tslib", "path", "typescript", "@angular/language-service/src/diagnostic_messages", "@angular/language-service/src/expression_diagnostics", "@angular/language-service/src/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var path = require("path");
    var ts = require("typescript");
    var diagnostic_messages_1 = require("@angular/language-service/src/diagnostic_messages");
    var expression_diagnostics_1 = require("@angular/language-service/src/expression_diagnostics");
    var utils_1 = require("@angular/language-service/src/utils");
    /**
     * Return diagnostic information for the parsed AST of the template.
     * @param ast contains HTML and template AST
     */
    function getTemplateDiagnostics(ast) {
        var parseErrors = ast.parseErrors, templateAst = ast.templateAst, htmlAst = ast.htmlAst, template = ast.template;
        if (parseErrors && parseErrors.length) {
            return parseErrors.map(function (e) {
                return {
                    kind: ts.DiagnosticCategory.Error,
                    span: utils_1.offsetSpan(utils_1.spanOf(e.span), template.span.start),
                    message: e.msg,
                };
            });
        }
        return expression_diagnostics_1.getTemplateExpressionDiagnostics({
            templateAst: templateAst,
            htmlAst: htmlAst,
            offset: template.span.start,
            query: template.query,
            members: template.members,
            source: ast.template.source,
        });
    }
    exports.getTemplateDiagnostics = getTemplateDiagnostics;
    /**
     * Performs a variety diagnostics on directive declarations.
     *
     * @param declarations Angular directive declarations
     * @param modules NgModules in the project
     * @param host TypeScript service host used to perform TypeScript queries
     * @return diagnosed errors, if any
     */
    function getDeclarationDiagnostics(declarations, modules, host) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
        var directives = new Set();
        try {
            for (var _e = tslib_1.__values(modules.ngModules), _f = _e.next(); !_f.done; _f = _e.next()) {
                var ngModule = _f.value;
                try {
                    for (var _g = (e_2 = void 0, tslib_1.__values(ngModule.declaredDirectives)), _h = _g.next(); !_h.done; _h = _g.next()) {
                        var directive = _h.value;
                        directives.add(directive.reference);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var results = [];
        try {
            for (var declarations_1 = tslib_1.__values(declarations), declarations_1_1 = declarations_1.next(); !declarations_1_1.done; declarations_1_1 = declarations_1.next()) {
                var declaration = declarations_1_1.value;
                var errors = declaration.errors, metadata = declaration.metadata, type = declaration.type, declarationSpan = declaration.declarationSpan;
                var sf = host.getSourceFile(type.filePath);
                if (!sf) {
                    host.error("directive " + type.name + " exists but has no source file");
                    return [];
                }
                // TypeScript identifier of the directive declaration annotation (e.g. "Component" or
                // "Directive") on a directive class.
                var directiveIdentifier = utils_1.findTightestNode(sf, declarationSpan.start);
                if (!directiveIdentifier) {
                    host.error("directive " + type.name + " exists but has no identifier");
                    return [];
                }
                try {
                    for (var errors_1 = (e_4 = void 0, tslib_1.__values(errors)), errors_1_1 = errors_1.next(); !errors_1_1.done; errors_1_1 = errors_1.next()) {
                        var error = errors_1_1.value;
                        results.push({
                            kind: ts.DiagnosticCategory.Error,
                            message: error.message,
                            span: error.span,
                        });
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (errors_1_1 && !errors_1_1.done && (_d = errors_1.return)) _d.call(errors_1);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                if (!modules.ngModuleByPipeOrDirective.has(declaration.type)) {
                    results.push(diagnostic_messages_1.createDiagnostic(declarationSpan, diagnostic_messages_1.Diagnostic.directive_not_in_module, metadata.isComponent ? 'Component' : 'Directive', type.name));
                }
                if (metadata.isComponent) {
                    var _j = metadata.template, template = _j.template, templateUrl = _j.templateUrl, styleUrls = _j.styleUrls;
                    if (template === null && !templateUrl) {
                        results.push(diagnostic_messages_1.createDiagnostic(declarationSpan, diagnostic_messages_1.Diagnostic.missing_template_and_templateurl, type.name));
                    }
                    else if (templateUrl) {
                        if (template) {
                            results.push(diagnostic_messages_1.createDiagnostic(declarationSpan, diagnostic_messages_1.Diagnostic.both_template_and_templateurl, type.name));
                        }
                        // Find templateUrl value from the directive call expression, which is the parent of the
                        // directive identifier.
                        //
                        // TODO: We should create an enum of the various properties a directive can have to use
                        // instead of string literals. We can then perform a mass migration of all literal usages.
                        var templateUrlNode = utils_1.findPropertyValueOfType(directiveIdentifier.parent, 'templateUrl', ts.isLiteralExpression);
                        if (!templateUrlNode) {
                            host.error("templateUrl " + templateUrl + " exists but its TypeScript node doesn't");
                            return [];
                        }
                        results.push.apply(results, tslib_1.__spread(validateUrls([templateUrlNode], host.tsLsHost)));
                    }
                    if (styleUrls.length > 0) {
                        // Find styleUrls value from the directive call expression, which is the parent of the
                        // directive identifier.
                        var styleUrlsNode = utils_1.findPropertyValueOfType(directiveIdentifier.parent, 'styleUrls', ts.isArrayLiteralExpression);
                        if (!styleUrlsNode) {
                            host.error("styleUrls property exists but its TypeScript node doesn't'");
                            return [];
                        }
                        results.push.apply(results, tslib_1.__spread(validateUrls(styleUrlsNode.elements, host.tsLsHost)));
                    }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (declarations_1_1 && !declarations_1_1.done && (_c = declarations_1.return)) _c.call(declarations_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return results;
    }
    exports.getDeclarationDiagnostics = getDeclarationDiagnostics;
    /**
     * Checks that URLs on a directive point to a valid file.
     * Note that this diagnostic check may require a filesystem hit, and thus may be slower than other
     * checks.
     *
     * @param urls urls to check for validity
     * @param tsLsHost TS LS host used for querying filesystem information
     * @return diagnosed url errors, if any
     */
    function validateUrls(urls, tsLsHost) {
        if (!tsLsHost.fileExists) {
            return [];
        }
        var allErrors = [];
        // TODO(ayazhafiz): most of this logic can be unified with the logic in
        // definitions.ts#getUrlFromProperty. Create a utility function to be used by both.
        for (var i = 0; i < urls.length; ++i) {
            var urlNode = urls[i];
            if (!ts.isStringLiteralLike(urlNode)) {
                // If a non-string value is assigned to a URL node (like `templateUrl`), a type error will be
                // picked up by the TS Language Server.
                continue;
            }
            var curPath = urlNode.getSourceFile().fileName;
            var url = path.join(path.dirname(curPath), urlNode.text);
            if (tsLsHost.fileExists(url))
                continue;
            // Exclude opening and closing quotes in the url span.
            var urlSpan = { start: urlNode.getStart() + 1, end: urlNode.end - 1 };
            allErrors.push(diagnostic_messages_1.createDiagnostic(urlSpan, diagnostic_messages_1.Diagnostic.invalid_templateurl));
        }
        return allErrors;
    }
    /**
     * Return a recursive data structure that chains diagnostic messages.
     * @param chain
     */
    function chainDiagnostics(chain) {
        return {
            messageText: chain.message,
            category: ts.DiagnosticCategory.Error,
            code: 0,
            next: chain.next ? chain.next.map(chainDiagnostics) : undefined
        };
    }
    /**
     * Convert ng.Diagnostic to ts.Diagnostic.
     * @param d diagnostic
     * @param file
     */
    function ngDiagnosticToTsDiagnostic(d, file) {
        return {
            file: file,
            start: d.span.start,
            length: d.span.end - d.span.start,
            messageText: typeof d.message === 'string' ? d.message : chainDiagnostics(d.message),
            category: d.kind,
            code: 0,
            source: 'ng',
        };
    }
    exports.ngDiagnosticToTsDiagnostic = ngDiagnosticToTsDiagnostic;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9kaWFnbm9zdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFHSCwyQkFBNkI7SUFDN0IsK0JBQWlDO0lBR2pDLHlGQUFtRTtJQUNuRSwrRkFBMEU7SUFHMUUsNkRBQXNGO0lBSXRGOzs7T0FHRztJQUNILFNBQWdCLHNCQUFzQixDQUFDLEdBQWM7UUFDNUMsSUFBQSw2QkFBVyxFQUFFLDZCQUFXLEVBQUUscUJBQU8sRUFBRSx1QkFBUSxDQUFRO1FBQzFELElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7WUFDckMsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQztnQkFDdEIsT0FBTztvQkFDTCxJQUFJLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUs7b0JBQ2pDLElBQUksRUFBRSxrQkFBVSxDQUFDLGNBQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7b0JBQ3JELE9BQU8sRUFBRSxDQUFDLENBQUMsR0FBRztpQkFDZixDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUNELE9BQU8seURBQWdDLENBQUM7WUFDdEMsV0FBVyxFQUFFLFdBQVc7WUFDeEIsT0FBTyxFQUFFLE9BQU87WUFDaEIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSztZQUMzQixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7WUFDckIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPO1lBQ3pCLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU07U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQW5CRCx3REFtQkM7SUFFRDs7Ozs7OztPQU9H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UCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztTQUNoRSxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQiwwQkFBMEIsQ0FDdEMsQ0FBZ0IsRUFBRSxJQUErQjtRQUNuRCxPQUFPO1lBQ0wsSUFBSSxNQUFBO1lBQ0osS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSztZQUNuQixNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLO1lBQ2pDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBQ3BGLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSTtZQUNoQixJQUFJLEVBQUUsQ0FBQztZQUNQLE1BQU0sRUFBRSxJQUFJO1NBQ2IsQ0FBQztJQUNKLENBQUM7SUFYRCxnRUFXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtOZ0FuYWx5emVkTW9kdWxlc30gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0FzdFJlc3VsdH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHtEaWFnbm9zdGljLCBjcmVhdGVEaWFnbm9zdGljfSBmcm9tICcuL2RpYWdub3N0aWNfbWVzc2FnZXMnO1xuaW1wb3J0IHtnZXRUZW1wbGF0ZUV4cHJlc3Npb25EaWFnbm9zdGljc30gZnJvbSAnLi9leHByZXNzaW9uX2RpYWdub3N0aWNzJztcbmltcG9ydCAqIGFzIG5nIGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtUeXBlU2NyaXB0U2VydmljZUhvc3R9IGZyb20gJy4vdHlwZXNjcmlwdF9ob3N0JztcbmltcG9ydCB7ZmluZFByb3BlcnR5VmFsdWVPZlR5cGUsIGZpbmRUaWdodGVzdE5vZGUsIG9mZnNldFNwYW4sIHNwYW5PZn0gZnJvbSAnLi91dGlscyc7XG5cblxuXG4vKipcbiAqIFJldHVybiBkaWFnbm9zdGljIGluZm9ybWF0aW9uIGZvciB0aGUgcGFyc2VkIEFTVCBvZiB0aGUgdGVtcGxhdGUuXG4gKiBAcGFyYW0gYXN0IGNvbnRhaW5zIEhUTUwgYW5kIHRlbXBsYXRlIEFTVFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVtcGxhdGVEaWFnbm9zdGljcyhhc3Q6IEFzdFJlc3VsdCk6IG5nLkRpYWdub3N0aWNbXSB7XG4gIGNvbnN0IHtwYXJzZUVycm9ycywgdGVtcGxhdGVBc3QsIGh0bWxBc3QsIHRlbXBsYXRlfSA9IGFzdDtcbiAgaWYgKHBhcnNlRXJyb3JzICYmIHBhcnNlRXJyb3JzLmxlbmd0aCkge1xuICAgIHJldHVybiBwYXJzZUVycm9ycy5tYXAoZSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBraW5kOiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICAgIHNwYW46IG9mZnNldFNwYW4oc3Bhbk9mKGUuc3BhbiksIHRlbXBsYXRlLnNwYW4uc3RhcnQpLFxuICAgICAgICBtZXNzYWdlOiBlLm1zZyxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGdldFRlbXBsYXRlRXhwcmVzc2lvbkRpYWdub3N0aWNzKHtcbiAgICB0ZW1wbGF0ZUFzdDogdGVtcGxhdGVBc3QsXG4gICAgaHRtbEFzdDogaHRtbEFzdCxcbiAgICBvZmZzZXQ6IHRlbXBsYXRlLnNwYW4uc3RhcnQsXG4gICAgcXVlcnk6IHRlbXBsYXRlLnF1ZXJ5LFxuICAgIG1lbWJlcnM6IHRlbXBsYXRlLm1lbWJlcnMsXG4gICAgc291cmNlOiBhc3QudGVtcGxhdGUuc291cmNlLFxuICB9KTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtcyBhIHZhcmlldHkgZGlhZ25vc3RpY3Mgb24gZGlyZWN0aXZlIGRlY2xhcmF0aW9ucy5cbiAqXG4gKiBAcGFyYW0gZGVjbGFyYXRpb25zIEFuZ3VsYXIgZGlyZWN0aXZlIGRlY2xhcmF0aW9uc1xuICogQHBhcmFtIG1vZHVsZXMgTmdNb2R1bGVzIGluIHRoZSBwcm9qZWN0XG4gKiBAcGFyYW0gaG9zdCBUeXBlU2NyaXB0IHNlcnZpY2UgaG9zdCB1c2VkIHRvIHBlcmZvcm0gVHlwZVNjcmlwdCBxdWVyaWVzXG4gKiBAcmV0dXJuIGRpYWdub3NlZCBlcnJvcnMsIGlmIGFueVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVjbGFyYXRpb25EaWFnbm9zdGljcyhcbiAgICBkZWNsYXJhdGlvbnM6IG5nLkRlY2xhcmF0aW9uW10sIG1vZHVsZXM6IE5nQW5hbHl6ZWRNb2R1bGVzLFxuICAgIGhvc3Q6IFJlYWRvbmx5PFR5cGVTY3JpcHRTZXJ2aWNlSG9zdD4pOiBuZy5EaWFnbm9zdGljW10ge1xuICBjb25zdCBkaXJlY3RpdmVzID0gbmV3IFNldDxuZy5TdGF0aWNTeW1ib2w+KCk7XG4gIGZvciAoY29uc3QgbmdNb2R1bGUgb2YgbW9kdWxlcy5uZ01vZHVsZXMpIHtcbiAgICBmb3IgKGNvbnN0IGRpcmVjdGl2ZSBvZiBuZ01vZHVsZS5kZWNsYXJlZERpcmVjdGl2ZXMpIHtcbiAgICAgIGRpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZS5yZWZlcmVuY2UpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJlc3VsdHM6IG5nLkRpYWdub3N0aWNbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZGVjbGFyYXRpb24gb2YgZGVjbGFyYXRpb25zKSB7XG4gICAgY29uc3Qge2Vycm9ycywgbWV0YWRhdGEsIHR5cGUsIGRlY2xhcmF0aW9uU3Bhbn0gPSBkZWNsYXJhdGlvbjtcblxuICAgIGNvbnN0IHNmID0gaG9zdC5nZXRTb3VyY2VGaWxlKHR5cGUuZmlsZVBhdGgpO1xuICAgIGlmICghc2YpIHtcbiAgICAgIGhvc3QuZXJyb3IoYGRpcmVjdGl2ZSAke3R5cGUubmFtZX0gZXhpc3RzIGJ1dCBoYXMgbm8gc291cmNlIGZpbGVgKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgLy8gVHlwZVNjcmlwdCBpZGVudGlmaWVyIG9mIHRoZSBkaXJlY3RpdmUgZGVjbGFyYXRpb24gYW5ub3RhdGlvbiAoZS5nLiBcIkNvbXBvbmVudFwiIG9yXG4gICAgLy8gXCJEaXJlY3RpdmVcIikgb24gYSBkaXJlY3RpdmUgY2xhc3MuXG4gICAgY29uc3QgZGlyZWN0aXZlSWRlbnRpZmllciA9IGZpbmRUaWdodGVzdE5vZGUoc2YsIGRlY2xhcmF0aW9uU3Bhbi5zdGFydCk7XG4gICAgaWYgKCFkaXJlY3RpdmVJZGVudGlmaWVyKSB7XG4gICAgICBob3N0LmVycm9yKGBkaXJlY3RpdmUgJHt0eXBlLm5hbWV9IGV4aXN0cyBidXQgaGFzIG5vIGlkZW50aWZpZXJgKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGVycm9yIG9mIGVycm9ycykge1xuICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAga2luZDogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBzcGFuOiBlcnJvci5zcGFuLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFtb2R1bGVzLm5nTW9kdWxlQnlQaXBlT3JEaXJlY3RpdmUuaGFzKGRlY2xhcmF0aW9uLnR5cGUpKSB7XG4gICAgICByZXN1bHRzLnB1c2goY3JlYXRlRGlhZ25vc3RpYyhcbiAgICAgICAgICBkZWNsYXJhdGlvblNwYW4sIERpYWdub3N0aWMuZGlyZWN0aXZlX25vdF9pbl9tb2R1bGUsXG4gICAgICAgICAgbWV0YWRhdGEuaXNDb21wb25lbnQgPyAnQ29tcG9uZW50JyA6ICdEaXJlY3RpdmUnLCB0eXBlLm5hbWUpKTtcbiAgICB9XG5cbiAgICBpZiAobWV0YWRhdGEuaXNDb21wb25lbnQpIHtcbiAgICAgIGNvbnN0IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmwsIHN0eWxlVXJsc30gPSBtZXRhZGF0YS50ZW1wbGF0ZSAhO1xuICAgICAgaWYgKHRlbXBsYXRlID09PSBudWxsICYmICF0ZW1wbGF0ZVVybCkge1xuICAgICAgICByZXN1bHRzLnB1c2goY3JlYXRlRGlhZ25vc3RpYyhcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uU3BhbiwgRGlhZ25vc3RpYy5taXNzaW5nX3RlbXBsYXRlX2FuZF90ZW1wbGF0ZXVybCwgdHlwZS5uYW1lKSk7XG4gICAgICB9IGVsc2UgaWYgKHRlbXBsYXRlVXJsKSB7XG4gICAgICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgICAgIHJlc3VsdHMucHVzaChjcmVhdGVEaWFnbm9zdGljKFxuICAgICAgICAgICAgICBkZWNsYXJhdGlvblNwYW4sIERpYWdub3N0aWMuYm90aF90ZW1wbGF0ZV9hbmRfdGVtcGxhdGV1cmwsIHR5cGUubmFtZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluZCB0ZW1wbGF0ZVVybCB2YWx1ZSBmcm9tIHRoZSBkaXJlY3RpdmUgY2FsbCBleHByZXNzaW9uLCB3aGljaCBpcyB0aGUgcGFyZW50IG9mIHRoZVxuICAgICAgICAvLyBkaXJlY3RpdmUgaWRlbnRpZmllci5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIGNyZWF0ZSBhbiBlbnVtIG9mIHRoZSB2YXJpb3VzIHByb3BlcnRpZXMgYSBkaXJlY3RpdmUgY2FuIGhhdmUgdG8gdXNlXG4gICAgICAgIC8vIGluc3RlYWQgb2Ygc3RyaW5nIGxpdGVyYWxzLiBXZSBjYW4gdGhlbiBwZXJmb3JtIGEgbWFzcyBtaWdyYXRpb24gb2YgYWxsIGxpdGVyYWwgdXNhZ2VzLlxuICAgICAgICBjb25zdCB0ZW1wbGF0ZVVybE5vZGUgPSBmaW5kUHJvcGVydHlWYWx1ZU9mVHlwZShcbiAgICAgICAgICAgIGRpcmVjdGl2ZUlkZW50aWZpZXIucGFyZW50LCAndGVtcGxhdGVVcmwnLCB0cy5pc0xpdGVyYWxFeHByZXNzaW9uKTtcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZVVybE5vZGUpIHtcbiAgICAgICAgICBob3N0LmVycm9yKGB0ZW1wbGF0ZVVybCAke3RlbXBsYXRlVXJsfSBleGlzdHMgYnV0IGl0cyBUeXBlU2NyaXB0IG5vZGUgZG9lc24ndGApO1xuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdHMucHVzaCguLi52YWxpZGF0ZVVybHMoW3RlbXBsYXRlVXJsTm9kZV0sIGhvc3QudHNMc0hvc3QpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0eWxlVXJscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIEZpbmQgc3R5bGVVcmxzIHZhbHVlIGZyb20gdGhlIGRpcmVjdGl2ZSBjYWxsIGV4cHJlc3Npb24sIHdoaWNoIGlzIHRoZSBwYXJlbnQgb2YgdGhlXG4gICAgICAgIC8vIGRpcmVjdGl2ZSBpZGVudGlmaWVyLlxuICAgICAgICBjb25zdCBzdHlsZVVybHNOb2RlID0gZmluZFByb3BlcnR5VmFsdWVPZlR5cGUoXG4gICAgICAgICAgICBkaXJlY3RpdmVJZGVudGlmaWVyLnBhcmVudCwgJ3N0eWxlVXJscycsIHRzLmlzQXJyYXlMaXRlcmFsRXhwcmVzc2lvbik7XG4gICAgICAgIGlmICghc3R5bGVVcmxzTm9kZSkge1xuICAgICAgICAgIGhvc3QuZXJyb3IoYHN0eWxlVXJscyBwcm9wZXJ0eSBleGlzdHMgYnV0IGl0cyBUeXBlU2NyaXB0IG5vZGUgZG9lc24ndCdgKTtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHRzLnB1c2goLi4udmFsaWRhdGVVcmxzKHN0eWxlVXJsc05vZGUuZWxlbWVudHMsIGhvc3QudHNMc0hvc3QpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBDaGVja3MgdGhhdCBVUkxzIG9uIGEgZGlyZWN0aXZlIHBvaW50IHRvIGEgdmFsaWQgZmlsZS5cbiAqIE5vdGUgdGhhdCB0aGlzIGRpYWdub3N0aWMgY2hlY2sgbWF5IHJlcXVpcmUgYSBmaWxlc3lzdGVtIGhpdCwgYW5kIHRodXMgbWF5IGJlIHNsb3dlciB0aGFuIG90aGVyXG4gKiBjaGVja3MuXG4gKlxuICogQHBhcmFtIHVybHMgdXJscyB0byBjaGVjayBmb3IgdmFsaWRpdHlcbiAqIEBwYXJhbSB0c0xzSG9zdCBUUyBMUyBob3N0IHVzZWQgZm9yIHF1ZXJ5aW5nIGZpbGVzeXN0ZW0gaW5mb3JtYXRpb25cbiAqIEByZXR1cm4gZGlhZ25vc2VkIHVybCBlcnJvcnMsIGlmIGFueVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVVybHMoXG4gICAgdXJsczogQXJyYXlMaWtlPHRzLkV4cHJlc3Npb24+LCB0c0xzSG9zdDogUmVhZG9ubHk8dHMuTGFuZ3VhZ2VTZXJ2aWNlSG9zdD4pOiBuZy5EaWFnbm9zdGljW10ge1xuICBpZiAoIXRzTHNIb3N0LmZpbGVFeGlzdHMpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb25zdCBhbGxFcnJvcnM6IG5nLkRpYWdub3N0aWNbXSA9IFtdO1xuICAvLyBUT0RPKGF5YXpoYWZpeik6IG1vc3Qgb2YgdGhpcyBsb2dpYyBjYW4gYmUgdW5pZmllZCB3aXRoIHRoZSBsb2dpYyBpblxuICAvLyBkZWZpbml0aW9ucy50cyNnZXRVcmxGcm9tUHJvcGVydHkuIENyZWF0ZSBhIHV0aWxpdHkgZnVuY3Rpb24gdG8gYmUgdXNlZCBieSBib3RoLlxuICBmb3IgKGxldCBpID0gMDsgaSA8IHVybHMubGVuZ3RoOyArK2kpIHtcbiAgICBjb25zdCB1cmxOb2RlID0gdXJsc1tpXTtcbiAgICBpZiAoIXRzLmlzU3RyaW5nTGl0ZXJhbExpa2UodXJsTm9kZSkpIHtcbiAgICAgIC8vIElmIGEgbm9uLXN0cmluZyB2YWx1ZSBpcyBhc3NpZ25lZCB0byBhIFVSTCBub2RlIChsaWtlIGB0ZW1wbGF0ZVVybGApLCBhIHR5cGUgZXJyb3Igd2lsbCBiZVxuICAgICAgLy8gcGlja2VkIHVwIGJ5IHRoZSBUUyBMYW5ndWFnZSBTZXJ2ZXIuXG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgY3VyUGF0aCA9IHVybE5vZGUuZ2V0U291cmNlRmlsZSgpLmZpbGVOYW1lO1xuICAgIGNvbnN0IHVybCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUoY3VyUGF0aCksIHVybE5vZGUudGV4dCk7XG4gICAgaWYgKHRzTHNIb3N0LmZpbGVFeGlzdHModXJsKSkgY29udGludWU7XG5cbiAgICAvLyBFeGNsdWRlIG9wZW5pbmcgYW5kIGNsb3NpbmcgcXVvdGVzIGluIHRoZSB1cmwgc3Bhbi5cbiAgICBjb25zdCB1cmxTcGFuID0ge3N0YXJ0OiB1cmxOb2RlLmdldFN0YXJ0KCkgKyAxLCBlbmQ6IHVybE5vZGUuZW5kIC0gMX07XG4gICAgYWxsRXJyb3JzLnB1c2goY3JlYXRlRGlhZ25vc3RpYyh1cmxTcGFuLCBEaWFnbm9zdGljLmludmFsaWRfdGVtcGxhdGV1cmwpKTtcbiAgfVxuICByZXR1cm4gYWxsRXJyb3JzO1xufVxuXG4vKipcbiAqIFJldHVybiBhIHJlY3Vyc2l2ZSBkYXRhIHN0cnVjdHVyZSB0aGF0IGNoYWlucyBkaWFnbm9zdGljIG1lc3NhZ2VzLlxuICogQHBhcmFtIGNoYWluXG4gKi9cbmZ1bmN0aW9uIGNoYWluRGlhZ25vc3RpY3MoY2hhaW46IG5nLkRpYWdub3N0aWNNZXNzYWdlQ2hhaW4pOiB0cy5EaWFnbm9zdGljTWVzc2FnZUNoYWluIHtcbiAgcmV0dXJuIHtcbiAgICBtZXNzYWdlVGV4dDogY2hhaW4ubWVzc2FnZSxcbiAgICBjYXRlZ29yeTogdHMuRGlhZ25vc3RpY0NhdGVnb3J5LkVycm9yLFxuICAgIGNvZGU6IDAsXG4gICAgbmV4dDogY2hhaW4ubmV4dCA/IGNoYWluLm5leHQubWFwKGNoYWluRGlhZ25vc3RpY3MpIDogdW5kZWZpbmVkXG4gIH07XG59XG5cbi8qKlxuICogQ29udmVydCBuZy5EaWFnbm9zdGljIHRvIHRzLkRpYWdub3N0aWMuXG4gKiBAcGFyYW0gZCBkaWFnbm9zdGljXG4gKiBAcGFyYW0gZmlsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbmdEaWFnbm9zdGljVG9Uc0RpYWdub3N0aWMoXG4gICAgZDogbmcuRGlhZ25vc3RpYywgZmlsZTogdHMuU291cmNlRmlsZSB8IHVuZGVmaW5lZCk6IHRzLkRpYWdub3N0aWMge1xuICByZXR1cm4ge1xuICAgIGZpbGUsXG4gICAgc3RhcnQ6IGQuc3Bhbi5zdGFydCxcbiAgICBsZW5ndGg6IGQuc3Bhbi5lbmQgLSBkLnNwYW4uc3RhcnQsXG4gICAgbWVzc2FnZVRleHQ6IHR5cGVvZiBkLm1lc3NhZ2UgPT09ICdzdHJpbmcnID8gZC5tZXNzYWdlIDogY2hhaW5EaWFnbm9zdGljcyhkLm1lc3NhZ2UpLFxuICAgIGNhdGVnb3J5OiBkLmtpbmQsXG4gICAgY29kZTogMCxcbiAgICBzb3VyY2U6ICduZycsXG4gIH07XG59XG4iXX0=