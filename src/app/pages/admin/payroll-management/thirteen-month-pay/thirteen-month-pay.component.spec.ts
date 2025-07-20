import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirteenMonthPayComponent } from './thirteen-month-pay.component';

describe('ThirteenMonthPayComponent', () => {
  let component: ThirteenMonthPayComponent;
  let fixture: ComponentFixture<ThirteenMonthPayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirteenMonthPayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirteenMonthPayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
