import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureProcessorComponent } from './configure-processor.component';

describe('ConfigureProcessorComponent', () => {
  let component: ConfigureProcessorComponent;
  let fixture: ComponentFixture<ConfigureProcessorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureProcessorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureProcessorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
