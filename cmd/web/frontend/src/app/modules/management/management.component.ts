import { Component, OnInit } from '@angular/core';
import { ManagementService} from "../services/management.service";
import {Application} from "../../shared/interfaces/workflow";
import {MatTableDataSource} from "@angular/material/table";


@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementComponent implements OnInit {

  management_tree_data;
  applications: Application[];
  constructor(private ManagementService: ManagementService) { }

  ngOnInit(): void {
    this.ManagementService.loadApplications().subscribe((workflows: Application[]) => {
      this.applications = workflows;
      this.management_tree_data = new MatTableDataSource(workflows);
    });
  }

}
