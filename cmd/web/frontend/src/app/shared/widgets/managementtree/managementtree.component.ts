import { Component, Input, OnInit } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Workflow, Property, Processor } from "../../interfaces/workflow";
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { AddworkflowComponent } from '../dialogs/addworkflow/addworkflow.component'
import { AddprocessorComponent } from '../dialogs/addprocessor/addprocessor.component'
import { ConfigureProcessorComponent } from '../dialogs/configure-processor/configure-processor.component'
import { ManagementService } from '../../services/managementservice.service'
import { EventbusService } from '../../services/eventbus.service';
import { SelectionModel } from '@angular/cdk/collections';
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
  activeWorkflow;
  disableProcessor;
  disableStart;
  StartStopButtonText;
  StartStopButtonIcon;

  defaultDialogWidth: '250px';

  constructor(public dialog: MatDialog, private ManagementService: ManagementService, private EventService: EventbusService) {
    this.dataSource.data = this.data;
    this.treeControl.dataNodes = this.data;
    this.disableProcessor = true;
    this.disableStart = true;
    this.StartStopButtonText = "Start Workflow";
    this.StartStopButtonIcon = "play_arrow";
  }

  hasChild = (_: number, node: Workflow) => !!node.processors && node.processors.length > 0;
  isProcessor = (_: number, node: Processor) => !!node.properties && node.properties.length >= 0;
  ngOnInit(): void {
    this.dataSource.data = this.data;
    this.treeControl.dataNodes = this.data;

  }




  toggleAddProcessorButton() {
    if (!!this.activeNode.properties && this.activeNode.properties.length > 0 ){
      this.disableProcessor = true;
    }else{
      this.disableProcessor = false;
    }
  }

  toggleStartStopButton() {
    if(this.activeWorkflow.running){
      this.StartStopButtonText = "Stop Workflow";
      this.StartStopButtonIcon = "stop";
    }else {
      this.StartStopButtonText ="Start Workflow";
      this.StartStopButtonIcon="play_arrow";
    }
    // Make sure that all the current Processors does not have an Invalid setting, if it does , do not open up Start button
    if (this.activeWorkflow.processors === null) {
      this.disableStart = true;
    } else {
      this.disableStart = false;
    }
  }

  selectNode(node: Node) {
    // open up workflow button
    this.activeNode = node;
    this.toggleAddProcessorButton();
    if (this.activeNode.properties === undefined) {
      this.activeWorkflow = node;
      this.toggleStartStopButton();
    }
    

   
  }
  removeProcessor() {
    // Are you sure dialog? 
  }

  startProcessor(node : Processor) {
    this.ManagementService.startProcessor(this.activeWorkflow, node);
    this.EventService.triggerApplicationTreeReload();
  }
  addProcessor() {
    const dialogRef = this.dialog.open(AddprocessorComponent, {
      width: '500px',
      data: { workflow: this.activeNode.name, processors: this.processors }
    })

    dialogRef.afterClosed().subscribe(processor => {
      // send data to /processor POST
      if (processor === undefined) {
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

  startWorkflow() {
    this.ManagementService.startWorkflow({ name: this.activeWorkflow.name , running: this.activeWorkflow.running});
    this.EventService.triggerApplicationTreeReload();
    this.disableStart = true;
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

  configureProcessor(node: Node) {
    const dialogRef = this.dialog.open(ConfigureProcessorComponent, {
      width: this.defaultDialogWidth,
      data: { processor: node , workflow: this.activeWorkflow.name} ,
    })

    dialogRef.afterClosed().subscribe(result => {
      // Send to backend
      if (result !== undefined ) {
        if (result.delete === true){

          this.ManagementService.deleteProcessor(result.workflow, result.processor);
          this.EventService.triggerApplicationTreeReload();
          // delete
        }else {
          this.ManagementService.configureProcessor(this.activeWorkflow.name, result);
          this.EventService.triggerApplicationTreeReload();
        }
      }
     
    })
  }

  // reselectActiveNode will trigger a selection on the components activeNode, IF it still exists that is
  reselectActiveNode() {
    debugger;
  }

}

