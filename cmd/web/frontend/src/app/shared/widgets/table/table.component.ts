import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import { Workflow } from 'src/app/shared/interfaces/workflow';
import { merge } from 'rxjs';
@Component({
  selector: 'app-widget-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {

  @Input() data: [];
  dataSource = new MatTableDataSource<Workflow>(this.data);
  displayedColumns: string[] = ['name', 'processors'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  
  constructor() { }


  ngOnInit(): void {
  this.dataSource.paginator = this.paginator;
  }

}

