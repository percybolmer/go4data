/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, NgZone } from "@angular/core";
import * as Highcharts from "highcharts";
export class HighchartsChartComponent {
    /**
     * @param {?} el
     * @param {?} _zone
     */
    constructor(el, _zone // #75
    ) {
        this.el = el;
        this._zone = _zone;
        this.updateChange = new EventEmitter(true);
        this.chartInstance = new EventEmitter();
    }
    /**
     * @param {?} val
     * @return {?}
     */
    set options(val) {
        this.optionsValue = val;
        this.wrappedUpdateOrCreateChart();
    }
    /**
     * @param {?} val
     * @return {?}
     */
    set update(val) {
        if (val) {
            this.wrappedUpdateOrCreateChart();
            this.updateChange.emit(false); // clear the flag after update
        }
    }
    /**
     * @return {?}
     */
    wrappedUpdateOrCreateChart() {
        // #75
        if (this.runOutsideAngular) {
            this._zone.runOutsideAngular(() => {
                this.updateOrCreateChart();
            });
        }
        else {
            this.updateOrCreateChart();
        }
    }
    /**
     * @return {?}
     */
    updateOrCreateChart() {
        if (this.chart && this.chart.update) {
            this.chart.update(this.optionsValue, true, this.oneToOne || false);
        }
        else {
            this.chart = (/** @type {?} */ (this.Highcharts))[this.constructorType || 'chart'](this.el.nativeElement, this.optionsValue, this.callbackFunction || null);
            // emit chart instance on init
            this.chartInstance.emit(this.chart);
        }
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        // #44
        if (this.chart) { // #56
            // #56
            this.chart.destroy();
            this.chart = null;
        }
    }
}
HighchartsChartComponent.decorators = [
    { type: Component, args: [{
                selector: 'highcharts-chart',
                template: ''
            }] }
];
/** @nocollapse */
HighchartsChartComponent.ctorParameters = () => [
    { type: ElementRef, },
    { type: NgZone, },
];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGNoYXJ0cy1jaGFydC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9oaWdoY2hhcnRzLWFuZ3VsYXIvIiwic291cmNlcyI6WyJsaWIvaGlnaGNoYXJ0cy1jaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsc0JBQXNCO0FBQ3RHLE9BQU8sS0FBSyxVQUFVLG1CQUFtQjtBQU16QyxNQUFNLE9BQU8sd0JBQXdCOzs7OztJQXdCbkMsWUFDVSxJQUNBOztRQURBLE9BQUUsR0FBRixFQUFFO1FBQ0YsVUFBSyxHQUFMLEtBQUs7NEJBUlUsSUFBSSxZQUFZLENBQVUsSUFBSSxDQUFDOzZCQUM5QixJQUFJLFlBQVksRUFBb0I7S0FRMUQ7Ozs7O1FBcEJTLE9BQU8sQ0FBQyxHQUF1QjtRQUMxQyxJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQztRQUN4QixJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQzs7Ozs7O1FBRXZCLE1BQU0sQ0FBQyxHQUFZO1FBQzlCLElBQUksR0FBRyxFQUFFO1lBQ1AsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0I7Ozs7O0lBY0gsMEJBQTBCOztRQUN4QixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtnQkFDaEMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1NBQzVCO0tBQ0Y7Ozs7SUFFRCxtQkFBbUI7UUFDakIsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLENBQUM7U0FDcEU7YUFBTTtZQUNMLElBQUksQ0FBQyxLQUFLLEdBQUcsbUJBQUMsSUFBSSxDQUFDLFVBQWlCLEVBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBQyxDQUNwRSxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFDckIsSUFBSSxDQUFDLFlBQVksRUFDakIsSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FDOUIsQ0FBQzs7WUFHRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckM7S0FDRjs7OztJQUVELFdBQVc7O1FBQ1QsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUcsTUFBTTs7WUFDdkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztTQUNuQjtLQUNGOzs7WUEvREYsU0FBUyxTQUFDO2dCQUNULFFBQVEsRUFBRSxrQkFBa0I7Z0JBQzVCLFFBQVEsRUFBRSxFQUFFO2FBQ2I7Ozs7WUFObUIsVUFBVTtZQUEwQyxNQUFNOzs7MkJBUTNFLEtBQUs7Z0NBQ0wsS0FBSztpQ0FDTCxLQUFLO3lCQUNMLEtBQUs7a0NBQ0wsS0FBSzt3QkFFTCxLQUFLO3VCQUlMLEtBQUs7NkJBT0wsTUFBTTs4QkFDTixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50LCBFbGVtZW50UmVmLCBFdmVudEVtaXR0ZXIsIElucHV0LCBPbkRlc3Ryb3ksIE91dHB1dCwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCAqIGFzIEhpZ2hjaGFydHMgZnJvbSAnaGlnaGNoYXJ0cyc7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ2hpZ2hjaGFydHMtY2hhcnQnLFxyXG4gIHRlbXBsYXRlOiAnJ1xyXG59KVxyXG5leHBvcnQgY2xhc3MgSGlnaGNoYXJ0c0NoYXJ0Q29tcG9uZW50IGltcGxlbWVudHMgT25EZXN0cm95IHtcclxuICBASW5wdXQoKSBIaWdoY2hhcnRzOiB0eXBlb2YgSGlnaGNoYXJ0cztcclxuICBASW5wdXQoKSBjb25zdHJ1Y3RvclR5cGU6IHN0cmluZztcclxuICBASW5wdXQoKSBjYWxsYmFja0Z1bmN0aW9uOiBIaWdoY2hhcnRzLkNoYXJ0Q2FsbGJhY2tGdW5jdGlvbjtcclxuICBASW5wdXQoKSBvbmVUb09uZTogYm9vbGVhbjsgLy8gIzIwXHJcbiAgQElucHV0KCkgcnVuT3V0c2lkZUFuZ3VsYXI6IGJvb2xlYW47IC8vICM3NVxyXG5cclxuICBASW5wdXQoKSBzZXQgb3B0aW9ucyh2YWw6IEhpZ2hjaGFydHMuT3B0aW9ucykge1xyXG4gICAgdGhpcy5vcHRpb25zVmFsdWUgPSB2YWw7XHJcbiAgICB0aGlzLndyYXBwZWRVcGRhdGVPckNyZWF0ZUNoYXJ0KCk7XHJcbiAgfVxyXG4gIEBJbnB1dCgpIHNldCB1cGRhdGUodmFsOiBib29sZWFuKSB7XHJcbiAgICBpZiAodmFsKSB7XHJcbiAgICAgIHRoaXMud3JhcHBlZFVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKTtcclxuICAgICAgdGhpcy51cGRhdGVDaGFuZ2UuZW1pdChmYWxzZSk7IC8vIGNsZWFyIHRoZSBmbGFnIGFmdGVyIHVwZGF0ZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgQE91dHB1dCgpIHVwZGF0ZUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4odHJ1ZSk7XHJcbiAgQE91dHB1dCgpIGNoYXJ0SW5zdGFuY2UgPSBuZXcgRXZlbnRFbWl0dGVyPEhpZ2hjaGFydHMuQ2hhcnQ+KCk7IC8vICMyNlxyXG5cclxuICBwcml2YXRlIGNoYXJ0OiBIaWdoY2hhcnRzLkNoYXJ0O1xyXG4gIHByaXZhdGUgb3B0aW9uc1ZhbHVlOiBIaWdoY2hhcnRzLk9wdGlvbnM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBlbDogRWxlbWVudFJlZixcclxuICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSAvLyAjNzVcclxuICApIHt9XHJcblxyXG4gIHdyYXBwZWRVcGRhdGVPckNyZWF0ZUNoYXJ0KCkgeyAvLyAjNzVcclxuICAgIGlmICh0aGlzLnJ1bk91dHNpZGVBbmd1bGFyKSB7XHJcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudXBkYXRlT3JDcmVhdGVDaGFydCgpXHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy51cGRhdGVPckNyZWF0ZUNoYXJ0KCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVPckNyZWF0ZUNoYXJ0KCkge1xyXG4gICAgaWYgKHRoaXMuY2hhcnQgJiYgdGhpcy5jaGFydC51cGRhdGUpIHtcclxuICAgICAgdGhpcy5jaGFydC51cGRhdGUodGhpcy5vcHRpb25zVmFsdWUsIHRydWUsIHRoaXMub25lVG9PbmUgfHwgZmFsc2UpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5jaGFydCA9ICh0aGlzLkhpZ2hjaGFydHMgYXMgYW55KVt0aGlzLmNvbnN0cnVjdG9yVHlwZSB8fCAnY2hhcnQnXShcclxuICAgICAgICB0aGlzLmVsLm5hdGl2ZUVsZW1lbnQsXHJcbiAgICAgICAgdGhpcy5vcHRpb25zVmFsdWUsXHJcbiAgICAgICAgdGhpcy5jYWxsYmFja0Z1bmN0aW9uIHx8IG51bGxcclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIGVtaXQgY2hhcnQgaW5zdGFuY2Ugb24gaW5pdFxyXG4gICAgICB0aGlzLmNoYXJ0SW5zdGFuY2UuZW1pdCh0aGlzLmNoYXJ0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIG5nT25EZXN0cm95KCkgeyAvLyAjNDRcclxuICAgIGlmICh0aGlzLmNoYXJ0KSB7ICAvLyAjNTZcclxuICAgICAgdGhpcy5jaGFydC5kZXN0cm95KCk7XHJcbiAgICAgIHRoaXMuY2hhcnQgPSBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=