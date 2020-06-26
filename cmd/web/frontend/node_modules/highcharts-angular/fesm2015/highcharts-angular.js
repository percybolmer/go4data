import { Component, ElementRef, EventEmitter, Input, Output, NgZone, NgModule } from '@angular/core';
import 'highcharts';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
class HighchartsChartComponent {
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

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
class HighchartsChartModule {
}
HighchartsChartModule.decorators = [
    { type: NgModule, args: [{
                declarations: [HighchartsChartComponent],
                exports: [HighchartsChartComponent]
            },] }
];
/** @nocollapse */
HighchartsChartModule.ctorParameters = () => [];

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */

export { HighchartsChartModule, HighchartsChartComponent };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlnaGNoYXJ0cy1hbmd1bGFyLmpzLm1hcCIsInNvdXJjZXMiOlsibmc6Ly9oaWdoY2hhcnRzLWFuZ3VsYXIvbGliL2hpZ2hjaGFydHMtY2hhcnQuY29tcG9uZW50LnRzIiwibmc6Ly9oaWdoY2hhcnRzLWFuZ3VsYXIvbGliL2hpZ2hjaGFydHMtY2hhcnQubW9kdWxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgRWxlbWVudFJlZiwgRXZlbnRFbWl0dGVyLCBJbnB1dCwgT25EZXN0cm95LCBPdXRwdXQsIE5nWm9uZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgKiBhcyBIaWdoY2hhcnRzIGZyb20gJ2hpZ2hjaGFydHMnO1xyXG5cclxuQENvbXBvbmVudCh7XHJcbiAgc2VsZWN0b3I6ICdoaWdoY2hhcnRzLWNoYXJ0JyxcclxuICB0ZW1wbGF0ZTogJydcclxufSlcclxuZXhwb3J0IGNsYXNzIEhpZ2hjaGFydHNDaGFydENvbXBvbmVudCBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XHJcbiAgQElucHV0KCkgSGlnaGNoYXJ0czogdHlwZW9mIEhpZ2hjaGFydHM7XHJcbiAgQElucHV0KCkgY29uc3RydWN0b3JUeXBlOiBzdHJpbmc7XHJcbiAgQElucHV0KCkgY2FsbGJhY2tGdW5jdGlvbjogSGlnaGNoYXJ0cy5DaGFydENhbGxiYWNrRnVuY3Rpb247XHJcbiAgQElucHV0KCkgb25lVG9PbmU6IGJvb2xlYW47IC8vICMyMFxyXG4gIEBJbnB1dCgpIHJ1bk91dHNpZGVBbmd1bGFyOiBib29sZWFuOyAvLyAjNzVcclxuXHJcbiAgQElucHV0KCkgc2V0IG9wdGlvbnModmFsOiBIaWdoY2hhcnRzLk9wdGlvbnMpIHtcclxuICAgIHRoaXMub3B0aW9uc1ZhbHVlID0gdmFsO1xyXG4gICAgdGhpcy53cmFwcGVkVXBkYXRlT3JDcmVhdGVDaGFydCgpO1xyXG4gIH1cclxuICBASW5wdXQoKSBzZXQgdXBkYXRlKHZhbDogYm9vbGVhbikge1xyXG4gICAgaWYgKHZhbCkge1xyXG4gICAgICB0aGlzLndyYXBwZWRVcGRhdGVPckNyZWF0ZUNoYXJ0KCk7XHJcbiAgICAgIHRoaXMudXBkYXRlQ2hhbmdlLmVtaXQoZmFsc2UpOyAvLyBjbGVhciB0aGUgZmxhZyBhZnRlciB1cGRhdGVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIEBPdXRwdXQoKSB1cGRhdGVDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KHRydWUpO1xyXG4gIEBPdXRwdXQoKSBjaGFydEluc3RhbmNlID0gbmV3IEV2ZW50RW1pdHRlcjxIaWdoY2hhcnRzLkNoYXJ0PigpOyAvLyAjMjZcclxuXHJcbiAgcHJpdmF0ZSBjaGFydDogSGlnaGNoYXJ0cy5DaGFydDtcclxuICBwcml2YXRlIG9wdGlvbnNWYWx1ZTogSGlnaGNoYXJ0cy5PcHRpb25zO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXHJcbiAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUgLy8gIzc1XHJcbiAgKSB7fVxyXG5cclxuICB3cmFwcGVkVXBkYXRlT3JDcmVhdGVDaGFydCgpIHsgLy8gIzc1XHJcbiAgICBpZiAodGhpcy5ydW5PdXRzaWRlQW5ndWxhcikge1xyXG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yQ3JlYXRlQ2hhcnQoKVxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMudXBkYXRlT3JDcmVhdGVDaGFydCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlT3JDcmVhdGVDaGFydCgpIHtcclxuICAgIGlmICh0aGlzLmNoYXJ0ICYmIHRoaXMuY2hhcnQudXBkYXRlKSB7XHJcbiAgICAgIHRoaXMuY2hhcnQudXBkYXRlKHRoaXMub3B0aW9uc1ZhbHVlLCB0cnVlLCB0aGlzLm9uZVRvT25lIHx8IGZhbHNlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuY2hhcnQgPSAodGhpcy5IaWdoY2hhcnRzIGFzIGFueSlbdGhpcy5jb25zdHJ1Y3RvclR5cGUgfHwgJ2NoYXJ0J10oXHJcbiAgICAgICAgdGhpcy5lbC5uYXRpdmVFbGVtZW50LFxyXG4gICAgICAgIHRoaXMub3B0aW9uc1ZhbHVlLFxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tGdW5jdGlvbiB8fCBudWxsXHJcbiAgICAgICk7XHJcblxyXG4gICAgICAvLyBlbWl0IGNoYXJ0IGluc3RhbmNlIG9uIGluaXRcclxuICAgICAgdGhpcy5jaGFydEluc3RhbmNlLmVtaXQodGhpcy5jaGFydCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBuZ09uRGVzdHJveSgpIHsgLy8gIzQ0XHJcbiAgICBpZiAodGhpcy5jaGFydCkgeyAgLy8gIzU2XHJcbiAgICAgIHRoaXMuY2hhcnQuZGVzdHJveSgpO1xyXG4gICAgICB0aGlzLmNoYXJ0ID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwiaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7SGlnaGNoYXJ0c0NoYXJ0Q29tcG9uZW50fSBmcm9tICcuL2hpZ2hjaGFydHMtY2hhcnQuY29tcG9uZW50JztcclxuXHJcbkBOZ01vZHVsZSh7XHJcbiAgZGVjbGFyYXRpb25zOiBbIEhpZ2hjaGFydHNDaGFydENvbXBvbmVudCBdLFxyXG4gIGV4cG9ydHM6IFsgSGlnaGNoYXJ0c0NoYXJ0Q29tcG9uZW50IF1cclxufSlcclxuZXhwb3J0IGNsYXNzIEhpZ2hjaGFydHNDaGFydE1vZHVsZSB7fVxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBLE1BT2Esd0JBQXdCOzs7OztJQXdCbkMsWUFDVSxJQUNBOztRQURBLE9BQUUsR0FBRixFQUFFO1FBQ0YsVUFBSyxHQUFMLEtBQUs7NEJBUlUsSUFBSSxZQUFZLENBQVUsSUFBSSxDQUFDOzZCQUM5QixJQUFJLFlBQVksRUFBb0I7S0FRMUQ7Ozs7O1FBcEJTLE9BQU8sQ0FBQyxHQUF1QjtRQUMxQyxJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQztRQUN4QixJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQzs7Ozs7O1FBRXZCLE1BQU0sQ0FBQyxHQUFZO1FBQzlCLElBQUksR0FBRyxFQUFFO1lBQ1AsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0I7Ozs7O0lBY0gsMEJBQTBCOztRQUN4QixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUMxQixJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDO2dCQUMzQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTthQUMzQixDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7U0FDNUI7S0FDRjs7OztJQUVELG1CQUFtQjtRQUNqQixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsQ0FBQztTQUNwRTthQUFNO1lBQ0wsSUFBSSxDQUFDLEtBQUssR0FBRyxtQkFBQyxJQUFJLENBQUMsVUFBaUIsR0FBRSxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBQyxDQUNwRSxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFDckIsSUFBSSxDQUFDLFlBQVksRUFDakIsSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FDOUIsQ0FBQzs7WUFHRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckM7S0FDRjs7OztJQUVELFdBQVc7O1FBQ1QsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFOztZQUNkLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7U0FDbkI7S0FDRjs7O1lBL0RGLFNBQVMsU0FBQztnQkFDVCxRQUFRLEVBQUUsa0JBQWtCO2dCQUM1QixRQUFRLEVBQUUsRUFBRTthQUNiOzs7O1lBTm1CLFVBQVU7WUFBMEMsTUFBTTs7OzJCQVEzRSxLQUFLO2dDQUNMLEtBQUs7aUNBQ0wsS0FBSzt5QkFDTCxLQUFLO2tDQUNMLEtBQUs7d0JBRUwsS0FBSzt1QkFJTCxLQUFLOzZCQU9MLE1BQU07OEJBQ04sTUFBTTs7Ozs7OztBQzFCVCxNQU9hLHFCQUFxQjs7O1lBSmpDLFFBQVEsU0FBQztnQkFDUixZQUFZLEVBQUUsQ0FBRSx3QkFBd0IsQ0FBRTtnQkFDMUMsT0FBTyxFQUFFLENBQUUsd0JBQXdCLENBQUU7YUFDdEM7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9