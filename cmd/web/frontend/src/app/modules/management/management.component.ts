import { Component, OnInit } from '@angular/core';
import { ManagementService } from  '../../shared/services/managementservice.service'
import {Workflow, Processor} from "../../shared/interfaces/workflow";
import {MatTableDataSource} from "@angular/material/table";
import { EventbusService } from 'src/app/shared/services/eventbus.service';


@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss']
})
export class ManagementComponent implements OnInit {

  management_tree_data;
  workflows: Workflow[];
  processors: Processor[];
  constructor(private ManagementService: ManagementService, private EventBusService: EventbusService) { }

  ngOnInit(): void {
    this.loadWorkflow();
    this.loadProcessors();

    this.EventBusService.reloadWorkflow.subscribe(data => {
        this.loadWorkflow();
    })


  }

  loadWorkflow() {
    this.ManagementService.loadWorkflow().subscribe((workflows: Workflow[]) => {
      this.workflows = workflows;
      this.management_tree_data = new MatTableDataSource(workflows);
    });
  }

  loadProcessors() {
    this.ManagementService.loadProcessors().subscribe((processors: Processor[]) => {
      this.processors = processors;
    });
  }

}
