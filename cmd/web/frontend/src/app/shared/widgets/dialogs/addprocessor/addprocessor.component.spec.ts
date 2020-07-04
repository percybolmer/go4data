import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddprocessorComponent } from './addprocessor.component';

describe('AddprocessorComponent', () => {
  let component: AddprocessorComponent;
  let fixture: ComponentFixture<AddprocessorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddprocessorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddprocessorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
