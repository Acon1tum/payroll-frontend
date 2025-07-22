import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContirbutionsDeductionsComponent } from './contirbutions-deductions.component';

describe('ContirbutionsDeductionsComponent', () => {
  let component: ContirbutionsDeductionsComponent;
  let fixture: ComponentFixture<ContirbutionsDeductionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContirbutionsDeductionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContirbutionsDeductionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
