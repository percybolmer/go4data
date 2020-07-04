import {Component, Input, OnInit} from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Workflow, Property, Processor} from "../../interfaces/workflow";
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { AddworkflowComponent } from '../dialogs/addworkflow/addworkflow.component'
import { AddprocessorComponent } from '../dialogs/addprocessor/addprocessor.component'
import { ConfigureProcessorComponent } from '../dialogs/configure-processor/configure-processor.component'
import { ManagementService } from '../../services/managementservice.service'
import { EventbusService } from '../../services/eventbus.service';
import {SelectionModel} from '@angular/cdk/collections';
@Component({
  selector: 'app-widget-managementtree',
  templateUrl: './managementtree.component.html',
  styleUrls: ['./managementtree.component.scss']
})
export class ManagementtreeComponent implements OnInit {
  @Input() data: [];
  @Input() processors: [];
  treeControl = new NestedTreeControl<Workflow>(node => node.processors);
  dataSource = new MatTreeNestedDataSource<Workflow>();
  selection = new SelectionModel<Workflow>(false);
  activeNode;

  disableProcessor;
  defaultDialogWidth: '250px';

  constructor(public dialog: MatDialog, private ManagementService: ManagementService, private EventService: EventbusService) {
    this.dataSource.data = this.data;
    this.treeControl.dataNodes = this.data;
    this.disableProcessor = true;
    
  }

  hasChild = (_: number, node: Workflow) => !!node.processors && node.processors.length > 0 ;
  isProcessor = (_: number, node: Processor) => !!node.properties && node.properties.length >= 0;
  ngOnInit(): void {
    this.dataSource.data = this.data;
    this.treeControl.dataNodes = this.data;
    
  }





  selectNode(node : Node) {
      // open up workflow button
      if (this.activeNode === undefined) {
        this.activeNode = node;
      }
      if (!!this.activeNode.properties && this.activeNode.properties.length >0 ) {
        this.disableProcessor = true;
      }else {
        this.disableProcessor = false;
      }
    }

  addProcessor() {
    const dialogRef = this.dialog.open(AddprocessorComponent, {
      width: '500px',
      data: { workflow: this.activeNode.name, processors: this.processors }
    })

    dialogRef.afterClosed().subscribe(processor => {
      // send data to /processor POST
      if(processor === undefined){
        return;
      }
      this.ManagementService.addProcessor(this.activeNode.name, processor);
      // Just add the P here instead of reloading data to avoid losing selection and such
      this.EventService.triggerApplicationTreeReload();
      
      // Expand the workflow that has been selected
      // TreeControl.dataNodes are empty?
      // see https://material.angular.io/components/tree/examples and the DynamicData example
    });
  }

  // addWorkflow will only open a dialog if an application is selected
  addWorkflow() {

    const dialogRef = this.dialog.open(AddworkflowComponent, {
      width: this.defaultDialogWidth,
      data: {},
    })

    dialogRef.afterClosed().subscribe(result => {
      // send data to /workflow POST
      this.ManagementService.addWorkflow(result);
      // Push reload to eventbus
      this.EventService.triggerApplicationTreeReload();
      // Reselect activeNode --if exists
    })
  }

  configureProcessor(node : Node) {
    const dialogRef = this.dialog.open(ConfigureProcessorComponent, {
      width: this.defaultDialogWidth,
      data: node,
    })

    dialogRef.afterClosed().subscribe(result => {
      // Send to backend
      this.ManagementService.configureProcessor(this.activeNode.Name, result);
    })
  }

  // reselectActiveNode will trigger a selection on the components activeNode, IF it still exists that is
  reselectActiveNode() {
    debugger;
  }

}

