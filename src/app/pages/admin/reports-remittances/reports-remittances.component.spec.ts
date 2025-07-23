import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsRemittancesComponent } from './reports-remittances.component';

describe('ReportsRemittancesComponent', () => {
  let component: ReportsRemittancesComponent;
  let fixture: ComponentFixture<ReportsRemittancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsRemittancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsRemittancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
