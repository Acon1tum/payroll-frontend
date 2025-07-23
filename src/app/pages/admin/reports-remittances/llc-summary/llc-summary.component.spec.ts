import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LlcSummaryComponent } from './llc-summary.component';

describe('LlcSummaryComponent', () => {
  let component: LlcSummaryComponent;
  let fixture: ComponentFixture<LlcSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LlcSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LlcSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
