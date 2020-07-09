import { Component, OnInit, Inject } from '@angular/core';
import { Processor } from 'src/app/shared/interfaces/workflow';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA} from '@angular/material/dialog'
@Component({
  selector: 'app-configure-processor',
  templateUrl: './configure-processor.component.html',
  styleUrls: ['./configure-processor.component.scss']
})
export class ConfigureProcessorComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ConfigureProcessorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { processor: Processor, workflow: string}) { }


    onDeleteClick(): void {
      this.dialogRef.close({delete: true, processor: this.data.processor, workflow: this.data.workflow});
    }
  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnInit(): void {
  }

}
