import { Injectable } from '@angular/core';
import { BehaviorSubject} from 'rxjs'
@Injectable({
  providedIn: 'root'
})
export class EventbusService {


  reloadWorkflow: BehaviorSubject<boolean>;
  reload = false;

 

  constructor() { 
    this.reloadWorkflow = new BehaviorSubject(this.reload);
  }

  triggerApplicationTreeReload() {
    this.reloadWorkflow.next(true);
  }

}
