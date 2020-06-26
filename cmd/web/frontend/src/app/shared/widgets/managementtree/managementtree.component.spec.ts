import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementtreeComponent } from './managementtree.component';

describe('ManagementtreeComponent', () => {
  let component: ManagementtreeComponent;
  let fixture: ComponentFixture<ManagementtreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagementtreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagementtreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
