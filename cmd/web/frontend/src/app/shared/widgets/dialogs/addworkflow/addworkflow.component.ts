import { Component, OnInit, Inject } from '@angular/core';
import { Workflow } from '../../../interfaces/workflow';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog'

@Component({
  selector: 'app-addworkflow',
  templateUrl: './addworkflow.component.html',
  styleUrls: ['./addworkflow.component.scss']
})
export class AddworkflowComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<AddworkflowComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Workflow) { }


  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnInit(): void {
  }

}
