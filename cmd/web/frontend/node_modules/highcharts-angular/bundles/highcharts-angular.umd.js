(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core')) :
    typeof define === 'function' && define.amd ? define('highcharts-angular', ['exports', '@angular/core'], factory) :
    (factory((global['highcharts-angular'] = {}),global.ng.core));
}(this, (function (exports,core) { 'use strict';

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes} checked by tsc
     */
    var HighchartsChartComponent = /** @class */ (function () {
        function HighchartsChartComponent(el, _zone // #75
        ) {
            this.el = el;
            this._zone = _zone;
            this.updateChange = new core.EventEmitter(true);
            this.chartInstance = new core.EventEmitter();
        }
        Object.defineProperty(HighchartsChartComponent.prototype, "options", {
            set: /**
             * @param {?} val
             * @return {?}
             */ function (val) {
                this.optionsValue = val;
                this.wrappedUpdateOrCreateChart();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HighchartsChartComponent.prototype, "update", {
            set: /**
             * @param {?} val
             * @return {?}
             */ function (val) {
                if (val) {
                    this.wrappedUpdateOrCreateChart();
                    this.updateChange.emit(false); // clear the flag after update
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @return {?}
         */
        HighchartsChartComponent.prototype.wrappedUpdateOrCreateChart = /**
         * @return {?}
         */
            function () {
                var _this = this;
                // #75
                if (this.runOutsideAngular) {
                    this._zone.runOutsideAngular(function () {
                        _this.updateOrCreateChart();
                    });
                }
                else {
                    this.updateOrCreateChart();
                }
            };
        /**
         * @return {?}
         */
        HighchartsChartComponent.prototype.updateOrCreateChart = /**
         * @return {?}
         */
            function () {
                if (this.chart && this.chart.update) {
                    this.chart.update(this.optionsValue, true, this.oneToOne || false);
                }
                else {
                    this.chart = ( /** @type {?} */(this.Highcharts))[this.constructorType || 'chart'](this.el.nativeElement, this.optionsValue, this.callbackFunction || null);
                    // emit chart instance on init
                    this.chartInstance.emit(this.chart);
                }
            };
        /**
         * @return {?}
         */
        HighchartsChartComponent.prototype.ngOnDestroy = /**
         * @return {?}
         */
            function () {
                // #44
                if (this.chart) { // #56
                    // #56
                    this.chart.destroy();
                    this.chart = null;
                }
            };
        HighchartsChartComponent.decorators = [
            { type: core.Component, args: [{
                        selector: 'highcharts-chart',
                        template: ''
                    }] }
        ];
        /** @nocollapse */
        HighchartsChartComponent.ctorParameters = function () {
            return [
                { type: core.ElementRef, },
                { type: core.NgZone, },
            ];
        };
        HighchartsChartComponent.propDecorators = {
            "Highcharts": [{ type: core.Input },],
            "constructorType": [{ type: core.Input },],
            "callbackFunction": [{ type: core.Input },],
            "oneToOne": [{ type: core.Input },],
            "runOutsideAngular": [{ type: core.Input },],
            "options": [{ type: core.Input },],
            "update": [{ type: core.Input },],
            "updateChange": [{ type: core.Output },],
            "chartInstance": [{ type: core.Output },],
        };
        return HighchartsChartComponent;
    }());

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes} checked by tsc
     */
    var HighchartsChartModule = /** @class */ (function () {
        function HighchartsChartModule() {
        }
        HighchartsChartModule.decorators = [
            { type: core.NgModule, args: [{
                        declarations: [HighchartsChartComponent],
                        exports: [HighchartsChartComponent]
                    },] }
        ];
        /** @nocollapse */
        HighchartsChartModule.ctorParameters = function () { return []; };
        return HighchartsChartModule;
    }());

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes} checked by tsc
     */

    /**
     * @fileoverview added by tsickle
     * @suppress {checkTypes} checked by tsc
     */

    exports.HighchartsChartModule = HighchartsChartModule;
    exports.HighchartsChartComponent = HighchartsChartComponent;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGNoYXJ0cy1hbmd1bGFyLnVtZC5qcy5tYXAiLCJzb3VyY2VzIjpbIm5nOi8vaGlnaGNoYXJ0cy1hbmd1bGFyL2xpYi9oaWdoY2hhcnRzLWNoYXJ0LmNvbXBvbmVudC50cyIsIm5nOi8vaGlnaGNoYXJ0cy1hbmd1bGFyL2xpYi9oaWdoY2hhcnRzLWNoYXJ0Lm1vZHVsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE9uRGVzdHJveSwgT3V0cHV0LCBOZ1pvbmUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0ICogYXMgSGlnaGNoYXJ0cyBmcm9tICdoaWdoY2hhcnRzJztcclxuXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnaGlnaGNoYXJ0cy1jaGFydCcsXHJcbiAgdGVtcGxhdGU6ICcnXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBIaWdoY2hhcnRzQ2hhcnRDb21wb25lbnQgaW1wbGVtZW50cyBPbkRlc3Ryb3kge1xyXG4gIEBJbnB1dCgpIEhpZ2hjaGFydHM6IHR5cGVvZiBIaWdoY2hhcnRzO1xyXG4gIEBJbnB1dCgpIGNvbnN0cnVjdG9yVHlwZTogc3RyaW5nO1xyXG4gIEBJbnB1dCgpIGNhbGxiYWNrRnVuY3Rpb246IEhpZ2hjaGFydHMuQ2hhcnRDYWxsYmFja0Z1bmN0aW9uO1xyXG4gIEBJbnB1dCgpIG9uZVRvT25lOiBib29sZWFuOyAvLyAjMjBcclxuICBASW5wdXQoKSBydW5PdXRzaWRlQW5ndWxhcjogYm9vbGVhbjsgLy8gIzc1XHJcblxyXG4gIEBJbnB1dCgpIHNldCBvcHRpb25zKHZhbDogSGlnaGNoYXJ0cy5PcHRpb25zKSB7XHJcbiAgICB0aGlzLm9wdGlvbnNWYWx1ZSA9IHZhbDtcclxuICAgIHRoaXMud3JhcHBlZFVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKTtcclxuICB9XHJcbiAgQElucHV0KCkgc2V0IHVwZGF0ZSh2YWw6IGJvb2xlYW4pIHtcclxuICAgIGlmICh2YWwpIHtcclxuICAgICAgdGhpcy53cmFwcGVkVXBkYXRlT3JDcmVhdGVDaGFydCgpO1xyXG4gICAgICB0aGlzLnVwZGF0ZUNoYW5nZS5lbWl0KGZhbHNlKTsgLy8gY2xlYXIgdGhlIGZsYWcgYWZ0ZXIgdXBkYXRlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBAT3V0cHV0KCkgdXBkYXRlQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxib29sZWFuPih0cnVlKTtcclxuICBAT3V0cHV0KCkgY2hhcnRJbnN0YW5jZSA9IG5ldyBFdmVudEVtaXR0ZXI8SGlnaGNoYXJ0cy5DaGFydD4oKTsgLy8gIzI2XHJcblxyXG4gIHByaXZhdGUgY2hhcnQ6IEhpZ2hjaGFydHMuQ2hhcnQ7XHJcbiAgcHJpdmF0ZSBvcHRpb25zVmFsdWU6IEhpZ2hjaGFydHMuT3B0aW9ucztcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIGVsOiBFbGVtZW50UmVmLFxyXG4gICAgcHJpdmF0ZSBfem9uZTogTmdab25lIC8vICM3NVxyXG4gICkge31cclxuXHJcbiAgd3JhcHBlZFVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKSB7IC8vICM3NVxyXG4gICAgaWYgKHRoaXMucnVuT3V0c2lkZUFuZ3VsYXIpIHtcclxuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVPckNyZWF0ZUNoYXJ0KClcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKSB7XHJcbiAgICBpZiAodGhpcy5jaGFydCAmJiB0aGlzLmNoYXJ0LnVwZGF0ZSkge1xyXG4gICAgICB0aGlzLmNoYXJ0LnVwZGF0ZSh0aGlzLm9wdGlvbnNWYWx1ZSwgdHJ1ZSwgdGhpcy5vbmVUb09uZSB8fCBmYWxzZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmNoYXJ0ID0gKHRoaXMuSGlnaGNoYXJ0cyBhcyBhbnkpW3RoaXMuY29uc3RydWN0b3JUeXBlIHx8ICdjaGFydCddKFxyXG4gICAgICAgIHRoaXMuZWwubmF0aXZlRWxlbWVudCxcclxuICAgICAgICB0aGlzLm9wdGlvbnNWYWx1ZSxcclxuICAgICAgICB0aGlzLmNhbGxiYWNrRnVuY3Rpb24gfHwgbnVsbFxyXG4gICAgICApO1xyXG5cclxuICAgICAgLy8gZW1pdCBjaGFydCBpbnN0YW5jZSBvbiBpbml0XHJcbiAgICAgIHRoaXMuY2hhcnRJbnN0YW5jZS5lbWl0KHRoaXMuY2hhcnQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbmdPbkRlc3Ryb3koKSB7IC8vICM0NFxyXG4gICAgaWYgKHRoaXMuY2hhcnQpIHsgIC8vICM1NlxyXG4gICAgICB0aGlzLmNoYXJ0LmRlc3Ryb3koKTtcclxuICAgICAgdGhpcy5jaGFydCA9IG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiIsImltcG9ydCB7TmdNb2R1bGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQge0hpZ2hjaGFydHNDaGFydENvbXBvbmVudH0gZnJvbSAnLi9oaWdoY2hhcnRzLWNoYXJ0LmNvbXBvbmVudCc7XHJcblxyXG5ATmdNb2R1bGUoe1xyXG4gIGRlY2xhcmF0aW9uczogWyBIaWdoY2hhcnRzQ2hhcnRDb21wb25lbnQgXSxcclxuICBleHBvcnRzOiBbIEhpZ2hjaGFydHNDaGFydENvbXBvbmVudCBdXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBIaWdoY2hhcnRzQ2hhcnRNb2R1bGUge31cclxuIl0sIm5hbWVzIjpbIkV2ZW50RW1pdHRlciIsIkNvbXBvbmVudCIsIkVsZW1lbnRSZWYiLCJOZ1pvbmUiLCJJbnB1dCIsIk91dHB1dCIsIk5nTW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7UUErQkUsa0NBQ1UsSUFDQTs7WUFEQSxPQUFFLEdBQUYsRUFBRTtZQUNG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