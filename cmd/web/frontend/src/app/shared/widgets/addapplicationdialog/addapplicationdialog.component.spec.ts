import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddapplicationdialogComponent } from './addapplicationdialog.component';

describe('AddapplicationdialogComponent', () => {
  let component: AddapplicationdialogComponent;
  let fixture: ComponentFixture<AddapplicationdialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddapplicationdialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddapplicationdialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
