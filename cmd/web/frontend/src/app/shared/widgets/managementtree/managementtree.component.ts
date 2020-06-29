import {Component, Input, OnInit} from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Application, Workflow, Property, Processor} from "../../interfaces/workflow";
import { MatDialog } from '@angular/material/dialog';
import { AddapplicationdialogComponent } from '../addapplicationdialog/addapplicationdialog.component';
import { ManagementService } from '../../services/managementservice.service'
import { EventbusService } from '../../services/eventbus.service';
import { PlotBoxplotDataLabelsOptions } from 'highcharts';
@Component({
  selector: 'app-widget-managementtree',
  templateUrl: './managementtree.component.html',
  styleUrls: ['./managementtree.component.scss']
})
export class ManagementtreeComponent implements OnInit {
  @Input() data: [];

  treeControl = new NestedTreeControl<Application>(node => node.children);
  dataSource = new MatTreeNestedDataSource<Application>();
  activeNode;
  disableWorkflowButton: boolean;
  constructor(public dialog: MatDialog, private ManagementService: ManagementService, private EventService: EventbusService) {
    this.dataSource.data = this.data;
  }

  hasChild = (_: number, node: Application) => !!node.children && node.children.length > 0 ;

  ngOnInit(): void {
    this.dataSource.data = this.data;
    this.disableWorkflowButton = true;

  }

  selectNode(node : Node) {
      // open up workflow button 
      
      console.log("Clicked node: ", node);
      console.log("Active node: ", this.activeNode)
  }
  // addWorkflow will only open a dialog if an application is selected
  addWorkflow() {

  }
  // addApplication will open a dialog requesting a name for the new applcation
  addApplication() {
    const newApp: Application = {
      name: '',
      children: null,
      icon: '',
    }
    // Open Dialog with Form Field that allows ous to enter new Name for application
    const dialogRef = this.dialog.open(AddapplicationdialogComponent, {
      width: '250px',
      data: newApp,
    })

    dialogRef.afterClosed().subscribe(result => {
    // Send the Data to /addApplication POST
      this.ManagementService.addApplication(newApp);
      // push reload to eventbus
      this.EventService.triggerApplicationTreeReload()
    });

  }

}

