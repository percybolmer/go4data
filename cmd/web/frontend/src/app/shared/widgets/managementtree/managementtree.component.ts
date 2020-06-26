import {Component, Input, OnInit} from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {Application, Workflow, Property, Processor} from "../../interfaces/workflow";

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
  constructor() {
    this.dataSource.data = this.data;
  }

  hasChild = (_: number, node: Application) => !!node.children && node.children.length > 0 ;

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  selectNode(node : Node) {
      console.log(node);
  }
  addApplication() {
    // Open Dialog with Form Field that allows ous to enter new Name for application
    // Send the Data to /addApplication POST
    // Fix so Tree shows Processors and also Icons
    // Fix Tree Selection
  }

}

