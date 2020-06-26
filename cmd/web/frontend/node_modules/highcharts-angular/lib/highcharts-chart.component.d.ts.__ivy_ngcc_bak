import { ElementRef, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import * as Highcharts from 'highcharts';
export declare class HighchartsChartComponent implements OnDestroy {
    private el;
    private _zone;
    Highcharts: typeof Highcharts;
    constructorType: string;
    callbackFunction: Highcharts.ChartCallbackFunction;
    oneToOne: boolean;
    runOutsideAngular: boolean;
    options: Highcharts.Options;
    update: boolean;
    updateChange: EventEmitter<boolean>;
    chartInstance: EventEmitter<Highcharts.Chart>;
    private chart;
    private optionsValue;
    constructor(el: ElementRef, _zone: NgZone);
    wrappedUpdateOrCreateChart(): void;
    updateOrCreateChart(): void;
    ngOnDestroy(): void;
}
