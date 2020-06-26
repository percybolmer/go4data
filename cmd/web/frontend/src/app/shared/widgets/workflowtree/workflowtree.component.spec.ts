import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowtreeComponent } from './workflowtree.component';

describe('WorkflowtreeComponent', () => {
  let component: WorkflowtreeComponent;
  let fixture: ComponentFixture<WorkflowtreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowtreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowtreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
