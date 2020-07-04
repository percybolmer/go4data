import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { Processor } from '../../../interfaces/workflow';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {SelectionModel} from '@angular/cdk/collections';

@Component({
  selector: 'app-addprocessor',
  templateUrl: './addprocessor.component.html',
  styleUrls: ['./addprocessor.component.scss']
})
export class AddprocessorComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description'];
  dataSource = new MatTableDataSource<Processor>(this.data.processors);
  selection = new SelectionModel<Processor>(true, []);
  
  selectedProcessor;

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  constructor(
    public dialogRef: MatDialogRef<AddprocessorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { 
    }
  onNoClick(): void {
    this.dialogRef.close();
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

