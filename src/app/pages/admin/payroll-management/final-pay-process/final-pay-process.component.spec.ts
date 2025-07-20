import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalPayProcessComponent } from './final-pay-process.component';

describe('FinalPayProcessComponent', () => {
  let component: FinalPayProcessComponent;
  let fixture: ComponentFixture<FinalPayProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalPayProcessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalPayProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
