import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { Workflow } from 'src/app/shared/interfaces/workflow';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {


  tabledata;
  workflows: Workflow[];
  constructor(private DashboardService: DashboardService) { }

  ngOnInit(): void {
    this.DashboardService.loadWorkFlowData().subscribe((workflows: Workflow[]) => {
      this.workflows = workflows;
      this.tabledata = new MatTableDataSource(workflows);
    });

  }
}



