import { Component, OnInit, Input } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';

@Component({
  selector: 'app-widget-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {


  @Input() label: string;
  @Input() total: string;
  @Input() percentage: string;

  @Input() data: [];
  
  Highcharts = Highcharts;
  chartOptions = {};
  constructor() { }

  ngOnInit(): void {

    this.chartOptions = {
      chart: {
        type: 'area',
        backgroundColor: null,
        borderWidth: 0,
        margin: [2,2,2,2],
        height: 60
    },
    title: {
      text: null
    },
    subtitle: {
      text: null
    },
    tooltip: {
        split: true,
        outside: true
    },
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    // Removes border
    xAxis: {
      labels: {
        enabled: false
      },
      title: {
        text: null,
      },
      startOnTick: false,
      endOnTick: false,
      tickOptions: []
    },
    yAxis: {
      labels: {
        enabled: false
      },
      title: {
        text: null,
      },
      startOnTick: false,
      endOnTick: false,
      tickOptions: []
    },
    series: [{
      data: this.data

    }]
    };

    HC_exporting(Highcharts)

    // This is a dirty trick to fix charts not being completly responsive, so we trigger a resize all t he time
    setTimeout(() => {
      window.dispatchEvent(
        new Event('rezise')
      );
    }, 300);
  }

}
