import { Component, OnInit } from '@angular/core';
import { ManagementService } from  '../../shared/services/managementservice.service'
import {Application} from "../../shared/interfaces/workflow";
import {MatTableDataSource} from "@angular/material/table";
import { EventbusService } from 'src/app/shared/services/eventbus.service';


@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementComponent implements OnInit {

  management_tree_data;
  applications: Application[];
  constructor(private ManagementService: ManagementService, private EventBusService: EventbusService) { }

  ngOnInit(): void {
    this.loadApplicationTree();

    this.EventBusService.reloadApplicationTree.subscribe(data => {
        this.loadApplicationTree();
    })



  }

  loadApplicationTree() {
    this.ManagementService.loadApplications().subscribe((workflows: Application[]) => {
      this.applications = workflows;
      this.management_tree_data = new MatTableDataSource(workflows);
    });
  }

}
