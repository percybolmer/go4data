import { Component, OnInit, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {


  @Output() toggleSideBarEvent: EventEmitter<any> = new EventEmitter();
  
  constructor() { }

  ngOnInit(): void {
  }

  toogleSideBar(){
    this.toggleSideBarEvent.emit();
    // This is a dirty trick to fix charts not being completly responsive, so we trigger a resize all t he time
    setTimeout(() => {
      window.dispatchEvent(
        new Event('rezise')
      );
    }, 300);
  }

}
