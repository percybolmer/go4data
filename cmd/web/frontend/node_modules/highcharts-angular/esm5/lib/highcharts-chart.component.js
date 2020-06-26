/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, NgZone } from "@angular/core";
import * as Highcharts from "highcharts";
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
export { HighchartsChartComponent };
function HighchartsChartComponent_tsickle_Closure_declarations() {
    /** @type {!Array<{type: !Function, args: (undefined|!Array<?>)}>} */
    HighchartsChartComponent.decorators;
    /**
     * @nocollapse
     * @type {function(): !Array<(null|{type: ?, decorators: (undefined|!Array<{type: !Function, args: (undefined|!Array<?>)}>)})>}
     */
    HighchartsChartComponent.ctorParameters;
    /** @type {!Object<string,!Array<{type: !Function, args: (undefined|!Array<?>)}>>} */
    HighchartsChartComponent.propDecorators;
    /** @type {?} */
    HighchartsChartComponent.prototype.Highcharts;
    /** @type {?} */
    HighchartsChartComponent.prototype.constructorType;
    /** @type {?} */
    HighchartsChartComponent.prototype.callbackFunction;
    /** @type {?} */
    HighchartsChartComponent.prototype.oneToOne;
    /** @type {?} */
    HighchartsChartComponent.prototype.runOutsideAngular;
    /** @type {?} */
    HighchartsChartComponent.prototype.updateChange;
    /** @type {?} */
    HighchartsChartComponent.prototype.chartInstance;
    /** @type {?} */
    HighchartsChartComponent.prototype.chart;
    /** @type {?} */
    HighchartsChartComponent.prototype.optionsValue;
    /** @type {?} */
    HighchartsChartComponent.prototype.el;
    /** @type {?} */
    HighchartsChartComponent.prototype._zone;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGNoYXJ0cy1jaGFydC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9oaWdoY2hhcnRzLWFuZ3VsYXIvIiwic291cmNlcyI6WyJsaWIvaGlnaGNoYXJ0cy1jaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsc0JBQXNCO0FBQ3RHLE9BQU8sS0FBSyxVQUFVLG1CQUFtQjs7SUE4QnZDLGtDQUNVLElBQ0E7O1FBREEsT0FBRSxHQUFGLEVBQUU7UUFDRixVQUFLLEdBQUwsS0FBSzs0QkFSVSxJQUFJLFlBQVksQ0FBVSxJQUFJLENBQUM7NkJBQzlCLElBQUksWUFBWSxFQUFvQjtLQVExRDswQkFwQlMsNkNBQU87Ozs7O2tCQUFDLEdBQXVCO1lBQzFDLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1lBQ3hCLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDOzs7OzswQkFFdkIsNENBQU07Ozs7O2tCQUFDLEdBQVk7WUFDOUIsSUFBSSxHQUFHLEVBQUU7Z0JBQ1AsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQy9COzs7Ozs7OztJQWNILDZEQUEwQjs7O0lBQTFCO1FBQUEsaUJBUUM7O1FBUEMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztnQkFDM0IsS0FBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1NBQzVCO0tBQ0Y7Ozs7SUFFRCxzREFBbUI7OztJQUFuQjtRQUNFLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxDQUFDO1NBQ3BFO2FBQU07WUFDTCxJQUFJLENBQUMsS0FBSyxHQUFHLG1CQUFDLElBQUksQ0FBQyxVQUFpQixFQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsSUFBSSxPQUFPLENBQUMsQ0FDcEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQ3JCLElBQUksQ0FBQyxZQUFZLEVBQ2pCLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQzlCLENBQUM7O1lBR0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO0tBQ0Y7Ozs7SUFFRCw4Q0FBVzs7O0lBQVg7O1FBQ0UsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUcsTUFBTTs7WUFDdkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztTQUNuQjtLQUNGOztnQkEvREYsU0FBUyxTQUFDO29CQUNULFFBQVEsRUFBRSxrQkFBa0I7b0JBQzVCLFFBQVEsRUFBRSxFQUFFO2lCQUNiOzs7O2dCQU5tQixVQUFVO2dCQUEwQyxNQUFNOzs7K0JBUTNFLEtBQUs7b0NBQ0wsS0FBSztxQ0FDTCxLQUFLOzZCQUNMLEtBQUs7c0NBQ0wsS0FBSzs0QkFFTCxLQUFLOzJCQUlMLEtBQUs7aUNBT0wsTUFBTTtrQ0FDTixNQUFNOzttQ0ExQlQ7O1NBT2Esd0JBQXdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIElucHV0LCBPbkRlc3Ryb3ksIE91dHB1dCwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCAqIGFzIEhpZ2hjaGFydHMgZnJvbSAnaGlnaGNoYXJ0cyc7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ2hpZ2hjaGFydHMtY2hhcnQnLFxyXG4gIHRlbXBsYXRlOiAnJ1xyXG59KVxyXG5leHBvcnQgY2xhc3MgSGlnaGNoYXJ0c0NoYXJ0Q29tcG9uZW50IGltcGxlbWVudHMgT25EZXN0cm95IHtcclxuICBASW5wdXQoKSBIaWdoY2hhcnRzOiB0eXBlb2YgSGlnaGNoYXJ0cztcclxuICBASW5wdXQoKSBjb25zdHJ1Y3RvclR5cGU6IHN0cmluZztcclxuICBASW5wdXQoKSBjYWxsYmFja0Z1bmN0aW9uOiBIaWdoY2hhcnRzLkNoYXJ0Q2FsbGJhY2tGdW5jdGlvbjtcclxuICBASW5wdXQoKSBvbmVUb09uZTogYm9vbGVhbjsgLy8gIzIwXHJcbiAgQElucHV0KCkgcnVuT3V0c2lkZUFuZ3VsYXI6IGJvb2xlYW47IC8vICM3NVxyXG5cclxuICBASW5wdXQoKSBzZXQgb3B0aW9ucyh2YWw6IEhpZ2hjaGFydHMuT3B0aW9ucykge1xyXG4gICAgdGhpcy5vcHRpb25zVmFsdWUgPSB2YWw7XHJcbiAgICB0aGlzLndyYXBwZWRVcGRhdGVPckNyZWF0ZUNoYXJ0KCk7XHJcbiAgfVxyXG4gIEBJbnB1dCgpIHNldCB1cGRhdGUodmFsOiBib29sZWFuKSB7XHJcbiAgICBpZiAodmFsKSB7XHJcbiAgICAgIHRoaXMud3JhcHBlZFVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKTtcclxuICAgICAgdGhpcy51cGRhdGVDaGFuZ2UuZW1pdChmYWxzZSk7IC8vIGNsZWFyIHRoZSBmbGFnIGFmdGVyIHVwZGF0ZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgQE91dHB1dCgpIHVwZGF0ZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4odHJ1ZSk7XHJcbiAgQE91dHB1dCgpIGNoYXJ0SW5zdGFuY2UgPSBuZXcgRXZlbnRFbWl0dGVyPEhpZ2hjaGFydHMuQ2hhcnQ+KCk7IC8vICMyNlxyXG5cclxuICBwcml2YXRlIGNoYXJ0OiBIaWdoY2hhcnRzLkNoYXJ0O1xyXG4gIHByaXZhdGUgb3B0aW9uc1ZhbHVlOiBIaWdoY2hhcnRzLk9wdGlvbnM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBlbDogRWxlbWVudFJlZixcclxuICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSAvLyAjNzVcclxuICApIHt9XHJcblxyXG4gIHdyYXBwZWRVcGRhdGVPckNyZWF0ZUNoYXJ0KCkgeyAvLyAjNzVcclxuICAgIGlmICh0aGlzLnJ1bk91dHNpZGVBbmd1bGFyKSB7XHJcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudXBkYXRlT3JDcmVhdGVDaGFydCgpXHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy51cGRhdGVPckNyZWF0ZUNoYXJ0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVPckNyZWF0ZUNoYXJ0KCkge1xyXG4gICAgaWYgKHRoaXMuY2hhcnQgJiYgdGhpcy5jaGFydC51cGRhdGUpIHtcclxuICAgICAgdGhpcy5jaGFydC51cGRhdGUodGhpcy5vcHRpb25zVmFsdWUsIHRydWUsIHRoaXMub25lVG9PbmUgfHwgZmFsc2UpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5jaGFydCA9ICh0aGlzLkhpZ2hjaGFydHMgYXMgYW55KVt0aGlzLmNvbnN0cnVjdG9yVHlwZSB8fCAnY2hhcnQnXShcclxuICAgICAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQsXHJcbiAgICAgICAgdGhpcy5vcHRpb25zVmFsdWUsXHJcbiAgICAgICAgdGhpcy5jYWxsYmFja0Z1bmN0aW9uIHx8IG51bGxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIGVtaXQgY2hhcnQgaW5zdGFuY2Ugb24gaW5pdFxyXG4gICAgICB0aGlzLmNoYXJ0SW5zdGFuY2UuZW1pdCh0aGlzLmNoYXJ0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIG5nT25EZXN0cm95KCkgeyAvLyAjNDRcclxuICAgIGlmICh0aGlzLmNoYXJ0KSB7ICAvLyAjNTZcclxuICAgICAgdGhpcy5jaGFydC5kZXN0cm95KCk7XHJcbiAgICAgIHRoaXMuY2hhcnQgPSBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=