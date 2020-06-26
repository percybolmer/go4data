import { Component, ElementRef, EventEmitter, Input, Output, NgZone, NgModule } from '@angular/core';
import 'highcharts';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
var HighchartsChartComponent = /** @class */ (function () {
    function HighchartsChartComponent(el, _zone // #75
    ) {
        this.el = el;
        this._zone = _zone;
        this.updateChange = new EventEmitter(true);
        this.chartInstance = new EventEmitter();
    }
    Object.defineProperty(HighchartsChartComponent.prototype, "options", {
        set: /**
         * @param {?} val
         * @return {?}
         */
        function (val) {
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
         */
        function (val) {
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
            this.chart = (/** @type {?} */ (this.Highcharts))[this.constructorType || 'chart'](this.el.nativeElement, this.optionsValue, this.callbackFunction || null);
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
        { type: Component, args: [{
                    selector: 'highcharts-chart',
                    template: ''
                }] }
    ];
    /** @nocollapse */
    HighchartsChartComponent.ctorParameters = function () { return [
        { type: ElementRef, },
        { type: NgZone, },
    ]; };
    HighchartsChartComponent.propDecorators = {
        "Highcharts": [{ type: Input },],
        "constructorType": [{ type: Input },],
        "callbackFunction": [{ type: Input },],
        "oneToOne": [{ type: Input },],
        "runOutsideAngular": [{ type: Input },],
        "options": [{ type: Input },],
        "update": [{ type: Input },],
        "updateChange": [{ type: Output },],
        "chartInstance": [{ type: Output },],
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
        { type: NgModule, args: [{
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

export { HighchartsChartModule, HighchartsChartComponent };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGNoYXJ0cy1hbmd1bGFyLmpzLm1hcCIsInNvdXJjZXMiOlsibmc6Ly9oaWdoY2hhcnRzLWFuZ3VsYXIvbGliL2hpZ2hjaGFydHMtY2hhcnQuY29tcG9uZW50LnRzIiwibmc6Ly9oaWdoY2hhcnRzLWFuZ3VsYXIvbGliL2hpZ2hjaGFydHMtY2hhcnQubW9kdWxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgRWxlbWVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbnB1dCwgT25EZXN0cm95LCBPdXRwdXQsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgKiBhcyBIaWdoY2hhcnRzIGZyb20gJ2hpZ2hjaGFydHMnO1xyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICdoaWdoY2hhcnRzLWNoYXJ0JyxcclxuICB0ZW1wbGF0ZTogJydcclxufSlcclxuZXhwb3J0IGNsYXNzIEhpZ2hjaGFydHNDaGFydENvbXBvbmVudCBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XHJcbiAgQElucHV0KCkgSGlnaGNoYXJ0czogdHlwZW9mIEhpZ2hjaGFydHM7XHJcbiAgQElucHV0KCkgY29uc3RydWN0b3JUeXBlOiBzdHJpbmc7XHJcbiAgQElucHV0KCkgY2FsbGJhY2tGdW5jdGlvbjogSGlnaGNoYXJ0cy5DaGFydENhbGxiYWNrRnVuY3Rpb247XHJcbiAgQElucHV0KCkgb25lVG9PbmU6IGJvb2xlYW47IC8vICMyMFxyXG4gIEBJbnB1dCgpIHJ1bk91dHNpZGVBbmd1bGFyOiBib29sZWFuOyAvLyAjNzVcclxuXHJcbiAgQElucHV0KCkgc2V0IG9wdGlvbnModmFsOiBIaWdoY2hhcnRzLk9wdGlvbnMpIHtcclxuICAgIHRoaXMub3B0aW9uc1ZhbHVlID0gdmFsO1xyXG4gICAgdGhpcy53cmFwcGVkVXBkYXRlT3JDcmVhdGVDaGFydCgpO1xyXG4gIH1cclxuICBASW5wdXQoKSBzZXQgdXBkYXRlKHZhbDogYm9vbGVhbikge1xyXG4gICAgaWYgKHZhbCkge1xyXG4gICAgICB0aGlzLndyYXBwZWRVcGRhdGVPckNyZWF0ZUNoYXJ0KCk7XHJcbiAgICAgIHRoaXMudXBkYXRlQ2hhbmdlLmVtaXQoZmFsc2UpOyAvLyBjbGVhciB0aGUgZmxhZyBhZnRlciB1cGRhdGVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIEBPdXRwdXQoKSB1cGRhdGVDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KHRydWUpO1xyXG4gIEBPdXRwdXQoKSBjaGFydEluc3RhbmNlID0gbmV3IEV2ZW50RW1pdHRlcjxIaWdoY2hhcnRzLkNoYXJ0PigpOyAvLyAjMjZcclxuXHJcbiAgcHJpdmF0ZSBjaGFydDogSGlnaGNoYXJ0cy5DaGFydDtcclxuICBwcml2YXRlIG9wdGlvbnNWYWx1ZTogSGlnaGNoYXJ0cy5PcHRpb25zO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXHJcbiAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUgLy8gIzc1XHJcbiAgKSB7fVxyXG5cclxuICB3cmFwcGVkVXBkYXRlT3JDcmVhdGVDaGFydCgpIHsgLy8gIzc1XHJcbiAgICBpZiAodGhpcy5ydW5PdXRzaWRlQW5ndWxhcikge1xyXG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKVxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMudXBkYXRlT3JDcmVhdGVDaGFydCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlT3JDcmVhdGVDaGFydCgpIHtcclxuICAgIGlmICh0aGlzLmNoYXJ0ICYmIHRoaXMuY2hhcnQudXBkYXRlKSB7XHJcbiAgICAgIHRoaXMuY2hhcnQudXBkYXRlKHRoaXMub3B0aW9uc1ZhbHVlLCB0cnVlLCB0aGlzLm9uZVRvT25lIHx8IGZhbHNlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY2hhcnQgPSAodGhpcy5IaWdoY2hhcnRzIGFzIGFueSlbdGhpcy5jb25zdHJ1Y3RvclR5cGUgfHwgJ2NoYXJ0J10oXHJcbiAgICAgICAgdGhpcy5lbC5uYXRpdmVFbGVtZW50LFxyXG4gICAgICAgIHRoaXMub3B0aW9uc1ZhbHVlLFxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tGdW5jdGlvbiB8fCBudWxsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICAvLyBlbWl0IGNoYXJ0IGluc3RhbmNlIG9uIGluaXRcclxuICAgICAgdGhpcy5jaGFydEluc3RhbmNlLmVtaXQodGhpcy5jaGFydCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBuZ09uRGVzdHJveSgpIHsgLy8gIzQ0XHJcbiAgICBpZiAodGhpcy5jaGFydCkgeyAgLy8gIzU2XHJcbiAgICAgIHRoaXMuY2hhcnQuZGVzdHJveSgpO1xyXG4gICAgICB0aGlzLmNoYXJ0ID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7SGlnaGNoYXJ0c0NoYXJ0Q29tcG9uZW50fSBmcm9tICcuL2hpZ2hjaGFydHMtY2hhcnQuY29tcG9uZW50JztcclxuXHJcbkBOZ01vZHVsZSh7XHJcbiAgZGVjbGFyYXRpb25zOiBbIEhpZ2hjaGFydHNDaGFydENvbXBvbmVudCBdLFxyXG4gIGV4cG9ydHM6IFsgSGlnaGNoYXJ0c0NoYXJ0Q29tcG9uZW50IF1cclxufSlcclxuZXhwb3J0IGNsYXNzIEhpZ2hjaGFydHNDaGFydE1vZHVsZSB7fVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBO0lBK0JFLGtDQUNVLElBQ0E7O1FBREEsT0FBRSxHQUFGLEVBQUU7UUFDRixVQUFLLEdBQUwsS0FBSzs0QkFSVSxJQUFJLFlBQVksQ0FBVSxJQUFJLENBQUM7NkJBQzlCLElBQUksWUFBWSxFQUFvQjtLQVExRDswQkFwQlMsNkNBQU87Ozs7O2tCQUFDLEdBQXVCO1lBQzFDLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1lBQ3hCLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDOzs7OzswQkFFdkIsNENBQU07Ozs7O2tCQUFDLEdBQVk7WUFDOUIsSUFBSSxHQUFHLEVBQUU7Z0JBQ1AsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQy9COzs7Ozs7OztJQWNILDZEQUEwQjs7O0lBQTFCO1FBQUEsaUJBUUM7O1FBUEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztnQkFDM0IsS0FBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1NBQzVCO0tBQ0Y7Ozs7SUFFRCxzREFBbUI7OztJQUFuQjtRQUNFLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxDQUFDO1NBQ3BFO2FBQU07WUFDTCxJQUFJLENBQUMsS0FBSyxHQUFHLG1CQUFDLElBQUksQ0FBQyxVQUFpQixHQUFFLElBQUksQ0FBQyxlQUFlLElBQUksT0FBTyxDQUFDLENBQ3BFLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUNyQixJQUFJLENBQUMsWUFBWSxFQUNqQixJQUFJLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUM5QixDQUFDOztZQUdGLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNyQztLQUNGOzs7O0lBRUQsOENBQVc7OztJQUFYOztRQUNFLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTs7WUFDZCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1NBQ25CO0tBQ0Y7O2dCQS9ERixTQUFTLFNBQUM7b0JBQ1QsUUFBUSxFQUFFLGtCQUFrQjtvQkFDNUIsUUFBUSxFQUFFLEVBQUU7aUJBQ2I7Ozs7Z0JBTm1CLFVBQVU7Z0JBQTBDLE1BQU07OzsrQkFRM0UsS0FBSztvQ0FDTCxLQUFLO3FDQUNMLEtBQUs7NkJBQ0wsS0FBSztzQ0FDTCxLQUFLOzRCQUVMLEtBQUs7MkJBSUwsS0FBSztpQ0FPTCxNQUFNO2tDQUNOLE1BQU07O21DQTFCVDs7Ozs7OztBQ0FBOzs7O2dCQUdDLFFBQVEsU0FBQztvQkFDUixZQUFZLEVBQUUsQ0FBRSx3QkFBd0IsQ0FBRTtvQkFDMUMsT0FBTyxFQUFFLENBQUUsd0JBQXdCLENBQUU7aUJBQ3RDOzs7O2dDQU5EOzs7Ozs7Ozs7Ozs7Ozs7In0=