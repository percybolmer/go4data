import { Injectable } from '@angular/core';
import { BehaviorSubject} from 'rxjs'
@Injectable({
  providedIn: 'root'
})
export class EventbusService {


  reloadApplicationTree: BehaviorSubject<boolean>;
  reload = false;

  constructor() { 
    this.reloadApplicationTree = new BehaviorSubject(this.reload);

  }

  triggerApplicationTreeReload() {
    this.reloadApplicationTree.next(true);
  }
}
