import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GovtReportsComponent } from './govt-reports.component';

describe('GovtReportsComponent', () => {
  let component: GovtReportsComponent;
  let fixture: ComponentFixture<GovtReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovtReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GovtReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
