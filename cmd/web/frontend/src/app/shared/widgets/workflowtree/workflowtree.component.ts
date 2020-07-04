import { Component, OnInit, Input } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Workflow} from './../../interfaces/workflow';
@Component({
  selector: 'app-widget-workflowtree',
  templateUrl: './workflowtree.component.html',
  styleUrls: ['./workflowtree.component.scss']
})
export class WorkflowtreeComponent implements OnInit {


  @Input() data: [];
  dataSource = new MatTreeNestedDataSource<Workflow>();
  treeControl = new NestedTreeControl<Workflow>(node => node.processors);

  constructor() { }

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  hasChild = (_: number, node: Workflow) => !!node.processors && node.processors.length > 0 ;

}
