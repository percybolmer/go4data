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
        define("@angular/language-service/src/reflector_host", ["require", "exports", "@angular/compiler-cli/src/language_services", "path", "typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var language_services_1 = require("@angular/compiler-cli/src/language_services");
    var path = require("path");
    var ts = require("typescript");
    var ReflectorModuleModuleResolutionHost = /** @class */ (function () {
        function ReflectorModuleModuleResolutionHost(tsLSHost, getProgram) {
            this.tsLSHost = tsLSHost;
            this.getProgram = getProgram;
            this.metadataCollector = new language_services_1.MetadataCollector({
                // Note: verboseInvalidExpressions is important so that
                // the collector will collect errors instead of throwing
                verboseInvalidExpression: true,
            });
            if (tsLSHost.directoryExists) {
                this.directoryExists = function (directoryName) { return tsLSHost.directoryExists(directoryName); };
            }
            if (tsLSHost.realpath) {
                this.realpath = function (path) { return tsLSHost.realpath(path); };
            }
        }
        ReflectorModuleModuleResolutionHost.prototype.fileExists = function (fileName) {
            // TypeScript resolution logic walks through the following sequence in order:
            // package.json (read "types" field) -> .ts -> .tsx -> .d.ts
            // For more info, see
            // https://www.typescriptlang.org/docs/handbook/module-resolution.html
            // For Angular specifically, we can skip .tsx lookup
            if (fileName.endsWith('.tsx')) {
                return false;
            }
            if (this.tsLSHost.fileExists) {
                return this.tsLSHost.fileExists(fileName);
            }
            return !!this.tsLSHost.getScriptSnapshot(fileName);
        };
        ReflectorModuleModuleResolutionHost.prototype.readFile = function (fileName) {
            // readFile() is used by TypeScript to read package.json during module
            // resolution, and it's used by Angular to read metadata.json during
            // metadata resolution.
            if (this.tsLSHost.readFile) {
                return this.tsLSHost.readFile(fileName);
            }
            // As a fallback, read the JSON files from the editor snapshot.
            var snapshot = this.tsLSHost.getScriptSnapshot(fileName);
            if (!snapshot) {
                // MetadataReaderHost readFile() declaration should be
                // `readFile(fileName: string): string | undefined`
                return undefined;
            }
            return snapshot.getText(0, snapshot.getLength());
        };
        ReflectorModuleModuleResolutionHost.prototype.getSourceFileMetadata = function (fileName) {
            var sf = this.getProgram().getSourceFile(fileName);
            return sf ? this.metadataCollector.getMetadata(sf) : undefined;
        };
        ReflectorModuleModuleResolutionHost.prototype.cacheMetadata = function (fileName) {
            // Don't cache the metadata for .ts files as they might change in the editor!
            return fileName.endsWith('.d.ts');
        };
        return ReflectorModuleModuleResolutionHost;
    }());
    var ReflectorHost = /** @class */ (function () {
        function ReflectorHost(getProgram, tsLSHost) {
            this.tsLSHost = tsLSHost;
            this.metadataReaderCache = language_services_1.createMetadataReaderCache();
            // tsLSHost.getCurrentDirectory() returns the directory where tsconfig.json
            // is located. This is not the same as process.cwd() because the language
            // service host sets the "project root path" as its current directory.
            var currentDir = tsLSHost.getCurrentDirectory();
            this.fakeContainingPath = currentDir ? path.join(currentDir, 'fakeContainingFile.ts') : '';
            this.hostAdapter = new ReflectorModuleModuleResolutionHost(tsLSHost, getProgram);
            this.moduleResolutionCache = ts.createModuleResolutionCache(currentDir, function (s) { return s; }, // getCanonicalFileName
            tsLSHost.getCompilationSettings());
        }
        ReflectorHost.prototype.getMetadataFor = function (modulePath) {
            return language_services_1.readMetadata(modulePath, this.hostAdapter, this.metadataReaderCache);
        };
        ReflectorHost.prototype.moduleNameToFileName = function (moduleName, containingFile) {
            if (!containingFile) {
                if (moduleName.startsWith('.')) {
                    throw new Error('Resolution of relative paths requires a containing file.');
                }
                if (!this.fakeContainingPath) {
                    // If current directory is empty then the file must belong to an inferred
                    // project (no tsconfig.json), in which case it's not possible to resolve
                    // the module without the caller explicitly providing a containing file.
                    throw new Error("Could not resolve '" + moduleName + "' without a containing file.");
                }
                containingFile = this.fakeContainingPath;
            }
            var compilerOptions = this.tsLSHost.getCompilationSettings();
            var resolved = ts.resolveModuleName(moduleName, containingFile, compilerOptions, this.hostAdapter, this.moduleResolutionCache)
                .resolvedModule;
            return resolved ? resolved.resolvedFileName : null;
        };
        ReflectorHost.prototype.getOutputName = function (filePath) { return filePath; };
        return ReflectorHost;
    }());
    exports.ReflectorHost = ReflectorHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdG9yX2hvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9sYW5ndWFnZS1zZXJ2aWNlL3NyYy9yZWZsZWN0b3JfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILGlGQUEySTtJQUMzSSwyQkFBNkI7SUFDN0IsK0JBQWlDO0lBRWpDO1FBV0UsNkNBQ3FCLFFBQWdDLEVBQ2hDLFVBQTRCO1lBRDVCLGFBQVEsR0FBUixRQUFRLENBQXdCO1lBQ2hDLGVBQVUsR0FBVixVQUFVLENBQWtCO1lBWmhDLHNCQUFpQixHQUFHLElBQUkscUNBQWlCLENBQUM7Z0JBQ3pELHVEQUF1RDtnQkFDdkQsd0RBQXdEO2dCQUN4RCx3QkFBd0IsRUFBRSxJQUFJO2FBQy9CLENBQUMsQ0FBQztZQVNELElBQUksUUFBUSxDQUFDLGVBQWUsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxVQUFBLGFBQWEsSUFBSSxPQUFBLFFBQVEsQ0FBQyxlQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUF6QyxDQUF5QyxDQUFDO2FBQ25GO1lBQ0QsSUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFO2dCQUNyQixJQUFJLENBQUMsUUFBUSxHQUFHLFVBQUEsSUFBSSxJQUFJLE9BQUEsUUFBUSxDQUFDLFFBQVUsQ0FBQyxJQUFJLENBQUMsRUFBekIsQ0FBeUIsQ0FBQzthQUNuRDtRQUNILENBQUM7UUFFRCx3REFBVSxHQUFWLFVBQVcsUUFBZ0I7WUFDekIsNkVBQTZFO1lBQzdFLDREQUE0RDtZQUM1RCxxQkFBcUI7WUFDckIsc0VBQXNFO1lBQ3RFLG9EQUFvRDtZQUNwRCxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQzdCLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFDRCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUM1QixP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QXNCLFVBQVUsaUNBQThCLENBQUMsQ0FBQztpQkFDakY7Z0JBQ0QsY0FBYyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQzthQUMxQztZQUNELElBQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUMvRCxJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQ2QsVUFBVSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFDN0QsSUFBSSxDQUFDLHFCQUFxQixDQUFDO2lCQUM1QixjQUFjLENBQUM7WUFDckMsT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3JELENBQUM7UUFFRCxxQ0FBYSxHQUFiLFVBQWMsUUFBZ0IsSUFBSSxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDdEQsb0JBQUM7SUFBRCxDQUFDLEFBN0NELElBNkNDO0lBN0NZLHNDQUFhIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0YXRpY1N5bWJvbFJlc29sdmVySG9zdH0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtNZXRhZGF0YUNvbGxlY3RvciwgTWV0YWRhdGFSZWFkZXJIb3N0LCBjcmVhdGVNZXRhZGF0YVJlYWRlckNhY2hlLCByZWFkTWV0YWRhdGF9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaS9zcmMvbGFuZ3VhZ2Vfc2VydmljZXMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5jbGFzcyBSZWZsZWN0b3JNb2R1bGVNb2R1bGVSZXNvbHV0aW9uSG9zdCBpbXBsZW1lbnRzIHRzLk1vZHVsZVJlc29sdXRpb25Ib3N0LCBNZXRhZGF0YVJlYWRlckhvc3Qge1xuICBwcml2YXRlIHJlYWRvbmx5IG1ldGFkYXRhQ29sbGVjdG9yID0gbmV3IE1ldGFkYXRhQ29sbGVjdG9yKHtcbiAgICAvLyBOb3RlOiB2ZXJib3NlSW52YWxpZEV4cHJlc3Npb25zIGlzIGltcG9ydGFudCBzbyB0aGF0XG4gICAgLy8gdGhlIGNvbGxlY3RvciB3aWxsIGNvbGxlY3QgZXJyb3JzIGluc3RlYWQgb2YgdGhyb3dpbmdcbiAgICB2ZXJib3NlSW52YWxpZEV4cHJlc3Npb246IHRydWUsXG4gIH0pO1xuXG4gIHJlYWRvbmx5IGRpcmVjdG9yeUV4aXN0cz86IChkaXJlY3RvcnlOYW1lOiBzdHJpbmcpID0+IGJvb2xlYW47XG4gIC8vIFJlc29sdmUgYSBzeW1ib2xpYyBsaW5rLlxuICByZWFscGF0aD86IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgcmVhZG9ubHkgdHNMU0hvc3Q6IHRzLkxhbmd1YWdlU2VydmljZUhvc3QsXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IGdldFByb2dyYW06ICgpID0+IHRzLlByb2dyYW0pIHtcbiAgICBpZiAodHNMU0hvc3QuZGlyZWN0b3J5RXhpc3RzKSB7XG4gICAgICB0aGlzLmRpcmVjdG9yeUV4aXN0cyA9IGRpcmVjdG9yeU5hbWUgPT4gdHNMU0hvc3QuZGlyZWN0b3J5RXhpc3RzICEoZGlyZWN0b3J5TmFtZSk7XG4gICAgfVxuICAgIGlmICh0c0xTSG9zdC5yZWFscGF0aCkge1xuICAgICAgdGhpcy5yZWFscGF0aCA9IHBhdGggPT4gdHNMU0hvc3QucmVhbHBhdGggIShwYXRoKTtcbiAgICB9XG4gIH1cblxuICBmaWxlRXhpc3RzKGZpbGVOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAvLyBUeXBlU2NyaXB0IHJlc29sdXRpb24gbG9naWMgd2Fsa3MgdGhyb3VnaCB0aGUgZm9sbG93aW5nIHNlcXVlbmNlIGluIG9yZGVyOlxuICAgIC8vIHBhY2thZ2UuanNvbiAocmVhZCBcInR5cGVzXCIgZmllbGQpIC0+IC50cyAtPiAudHN4IC0+IC5kLnRzXG4gICAgLy8gRm9yIG1vcmUgaW5mbywgc2VlXG4gICAgLy8gaHR0cHM6Ly93d3cudHlwZXNjcmlwdGxhbmcub3JnL2RvY3MvaGFuZGJvb2svbW9kdWxlLXJlc29sdXRpb24uaHRtbFxuICAgIC8vIEZvciBBbmd1bGFyIHNwZWNpZmljYWxseSwgd2UgY2FuIHNraXAgLnRzeCBsb29rdXBcbiAgICBpZiAoZmlsZU5hbWUuZW5kc1dpdGgoJy50c3gnKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy50c0xTSG9zdC5maWxlRXhpc3RzKSB7XG4gICAgICByZXR1cm4gdGhpcy50c0xTSG9zdC5maWxlRXhpc3RzKGZpbGVOYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuICEhdGhpcy50c0xTSG9zdC5nZXRTY3JpcHRTbmFwc2hvdChmaWxlTmFtZSk7XG4gIH1cblxuICByZWFkRmlsZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyByZWFkRmlsZSgpIGlzIHVzZWQgYnkgVHlwZVNjcmlwdCB0byByZWFkIHBhY2thZ2UuanNvbiBkdXJpbmcgbW9kdWxlXG4gICAgLy8gcmVzb2x1dGlvbiwgYW5kIGl0J3MgdXNlZCBieSBBbmd1bGFyIHRvIHJlYWQgbWV0YWRhdGEuanNvbiBkdXJpbmdcbiAgICAvLyBtZXRhZGF0YSByZXNvbHV0aW9uLlxuICAgIGlmICh0aGlzLnRzTFNIb3N0LnJlYWRGaWxlKSB7XG4gICAgICByZXR1cm4gdGhpcy50c0xTSG9zdC5yZWFkRmlsZShmaWxlTmFtZSkgITtcbiAgICB9XG4gICAgLy8gQXMgYSBmYWxsYmFjaywgcmVhZCB0aGUgSlNPTiBmaWxlcyBmcm9tIHRoZSBlZGl0b3Igc25hcHNob3QuXG4gICAgY29uc3Qgc25hcHNob3QgPSB0aGlzLnRzTFNIb3N0LmdldFNjcmlwdFNuYXBzaG90KGZpbGVOYW1lKTtcbiAgICBpZiAoIXNuYXBzaG90KSB7XG4gICAgICAvLyBNZXRhZGF0YVJlYWRlckhvc3QgcmVhZEZpbGUoKSBkZWNsYXJhdGlvbiBzaG91bGQgYmVcbiAgICAgIC8vIGByZWFkRmlsZShmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkYFxuICAgICAgcmV0dXJuIHVuZGVmaW5lZCAhO1xuICAgIH1cbiAgICByZXR1cm4gc25hcHNob3QuZ2V0VGV4dCgwLCBzbmFwc2hvdC5nZXRMZW5ndGgoKSk7XG4gIH1cblxuICBnZXRTb3VyY2VGaWxlTWV0YWRhdGEoZmlsZU5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IHNmID0gdGhpcy5nZXRQcm9ncmFtKCkuZ2V0U291cmNlRmlsZShmaWxlTmFtZSk7XG4gICAgcmV0dXJuIHNmID8gdGhpcy5tZXRhZGF0YUNvbGxlY3Rvci5nZXRNZXRhZGF0YShzZikgOiB1bmRlZmluZWQ7XG4gIH1cblxuICBjYWNoZU1ldGFkYXRhKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgICAvLyBEb24ndCBjYWNoZSB0aGUgbWV0YWRhdGEgZm9yIC50cyBmaWxlcyBhcyB0aGV5IG1pZ2h0IGNoYW5nZSBpbiB0aGUgZWRpdG9yIVxuICAgIHJldHVybiBmaWxlTmFtZS5lbmRzV2l0aCgnLmQudHMnKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVmbGVjdG9ySG9zdCBpbXBsZW1lbnRzIFN0YXRpY1N5bWJvbFJlc29sdmVySG9zdCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgaG9zdEFkYXB0ZXI6IFJlZmxlY3Rvck1vZHVsZU1vZHVsZVJlc29sdXRpb25Ib3N0O1xuICBwcml2YXRlIHJlYWRvbmx5IG1ldGFkYXRhUmVhZGVyQ2FjaGUgPSBjcmVhdGVNZXRhZGF0YVJlYWRlckNhY2hlKCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgbW9kdWxlUmVzb2x1dGlvbkNhY2hlOiB0cy5Nb2R1bGVSZXNvbHV0aW9uQ2FjaGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgZmFrZUNvbnRhaW5pbmdQYXRoOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoZ2V0UHJvZ3JhbTogKCkgPT4gdHMuUHJvZ3JhbSwgcHJpdmF0ZSByZWFkb25seSB0c0xTSG9zdDogdHMuTGFuZ3VhZ2VTZXJ2aWNlSG9zdCkge1xuICAgIC8vIHRzTFNIb3N0LmdldEN1cnJlbnREaXJlY3RvcnkoKSByZXR1cm5zIHRoZSBkaXJlY3Rvcnkgd2hlcmUgdHNjb25maWcuanNvblxuICAgIC8vIGlzIGxvY2F0ZWQuIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzIHByb2Nlc3MuY3dkKCkgYmVjYXVzZSB0aGUgbGFuZ3VhZ2VcbiAgICAvLyBzZXJ2aWNlIGhvc3Qgc2V0cyB0aGUgXCJwcm9qZWN0IHJvb3QgcGF0aFwiIGFzIGl0cyBjdXJyZW50IGRpcmVjdG9yeS5cbiAgICBjb25zdCBjdXJyZW50RGlyID0gdHNMU0hvc3QuZ2V0Q3VycmVudERpcmVjdG9yeSgpO1xuICAgIHRoaXMuZmFrZUNvbnRhaW5pbmdQYXRoID0gY3VycmVudERpciA/IHBhdGguam9pbihjdXJyZW50RGlyLCAnZmFrZUNvbnRhaW5pbmdGaWxlLnRzJykgOiAnJztcbiAgICB0aGlzLmhvc3RBZGFwdGVyID0gbmV3IFJlZmxlY3Rvck1vZHVsZU1vZHVsZVJlc29sdXRpb25Ib3N0KHRzTFNIb3N0LCBnZXRQcm9ncmFtKTtcbiAgICB0aGlzLm1vZHVsZVJlc29sdXRpb25DYWNoZSA9IHRzLmNyZWF0ZU1vZHVsZVJlc29sdXRpb25DYWNoZShcbiAgICAgICAgY3VycmVudERpcixcbiAgICAgICAgcyA9PiBzLCAgLy8gZ2V0Q2Fub25pY2FsRmlsZU5hbWVcbiAgICAgICAgdHNMU0hvc3QuZ2V0Q29tcGlsYXRpb25TZXR0aW5ncygpKTtcbiAgfVxuXG4gIGdldE1ldGFkYXRhRm9yKG1vZHVsZVBhdGg6IHN0cmluZyk6IHtba2V5OiBzdHJpbmddOiBhbnl9W118dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gcmVhZE1ldGFkYXRhKG1vZHVsZVBhdGgsIHRoaXMuaG9zdEFkYXB0ZXIsIHRoaXMubWV0YWRhdGFSZWFkZXJDYWNoZSk7XG4gIH1cblxuICBtb2R1bGVOYW1lVG9GaWxlTmFtZShtb2R1bGVOYW1lOiBzdHJpbmcsIGNvbnRhaW5pbmdGaWxlPzogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICAgIGlmICghY29udGFpbmluZ0ZpbGUpIHtcbiAgICAgIGlmIChtb2R1bGVOYW1lLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc29sdXRpb24gb2YgcmVsYXRpdmUgcGF0aHMgcmVxdWlyZXMgYSBjb250YWluaW5nIGZpbGUuJyk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuZmFrZUNvbnRhaW5pbmdQYXRoKSB7XG4gICAgICAgIC8vIElmIGN1cnJlbnQgZGlyZWN0b3J5IGlzIGVtcHR5IHRoZW4gdGhlIGZpbGUgbXVzdCBiZWxvbmcgdG8gYW4gaW5mZXJyZWRcbiAgICAgICAgLy8gcHJvamVjdCAobm8gdHNjb25maWcuanNvbiksIGluIHdoaWNoIGNhc2UgaXQncyBub3QgcG9zc2libGUgdG8gcmVzb2x2ZVxuICAgICAgICAvLyB0aGUgbW9kdWxlIHdpdGhvdXQgdGhlIGNhbGxlciBleHBsaWNpdGx5IHByb3ZpZGluZyBhIGNvbnRhaW5pbmcgZmlsZS5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmVzb2x2ZSAnJHttb2R1bGVOYW1lfScgd2l0aG91dCBhIGNvbnRhaW5pbmcgZmlsZS5gKTtcbiAgICAgIH1cbiAgICAgIGNvbnRhaW5pbmdGaWxlID0gdGhpcy5mYWtlQ29udGFpbmluZ1BhdGg7XG4gICAgfVxuICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IHRoaXMudHNMU0hvc3QuZ2V0Q29tcGlsYXRpb25TZXR0aW5ncygpO1xuICAgIGNvbnN0IHJlc29sdmVkID0gdHMucmVzb2x2ZU1vZHVsZU5hbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVOYW1lLCBjb250YWluaW5nRmlsZSwgY29tcGlsZXJPcHRpb25zLCB0aGlzLmhvc3RBZGFwdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb2R1bGVSZXNvbHV0aW9uQ2FjaGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgLnJlc29sdmVkTW9kdWxlO1xuICAgIHJldHVybiByZXNvbHZlZCA/IHJlc29sdmVkLnJlc29sdmVkRmlsZU5hbWUgOiBudWxsO1xuICB9XG5cbiAgZ2V0T3V0cHV0TmFtZShmaWxlUGF0aDogc3RyaW5nKSB7IHJldHVybiBmaWxlUGF0aDsgfVxufVxuIl19