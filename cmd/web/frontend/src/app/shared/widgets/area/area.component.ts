import { Component, OnInit, Input } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';

@Component({
  selector: 'app-widget-area',
  templateUrl: './area.component.html',
  styleUrls: ['./area.component.scss']
})
export class AreaComponent implements OnInit {


  @Input() data: [];

  chartOptions: {};

  Highcharts = Highcharts;

  constructor() { }

  
  ngOnInit(): void {
      this.chartOptions = {
        chart: {
          type: 'area'
      },
      title: {
          text: 'Processed bytes'
      },
      subtitle: {
          text: ''
      },
      
      tooltip: {
          split: true,
          valueSuffix: ' millions'
      },
      credits: {
        enabled: false
      },
      exporting: {
        enabled: true
      },
      
      series: this.data
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
