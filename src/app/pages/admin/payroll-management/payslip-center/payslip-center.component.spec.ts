import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayslipCenterComponent } from './payslip-center.component';

describe('PayslipCenterComponent', () => {
  let component: PayslipCenterComponent;
  let fixture: ComponentFixture<PayslipCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayslipCenterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayslipCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
