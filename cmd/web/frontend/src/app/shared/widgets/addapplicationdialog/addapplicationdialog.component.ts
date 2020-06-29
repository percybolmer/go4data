import { Component, OnInit, Inject, Input} from '@angular/core';
import { Application } from '../../interfaces/workflow';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog'

@Component({
  selector: 'app-addapplicationdialog',
  templateUrl: './addapplicationdialog.component.html',
  styleUrls: ['./addapplicationdialog.component.scss']
})
export class AddapplicationdialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AddapplicationdialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Application) { }


  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnInit(): void {
  }

}