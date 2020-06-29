import { Component, OnInit } from '@angular/core';
import { Workflow } from 'src/app/shared/interfaces/workflow';
import { MatTableDataSource } from '@angular/material/table';
import { ManagementService } from '../../shared/services/managementservice.service'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {


  tabledata;
  workflows: Workflow[];
  constructor(private DashboardService: ManagementService) { }

  ngOnInit(): void {
    this.DashboardService.loadApplications().subscribe((workflows: Workflow[]) => {
      this.workflows = workflows;
      this.tabledata = new MatTableDataSource(workflows);
    });

  }
}



