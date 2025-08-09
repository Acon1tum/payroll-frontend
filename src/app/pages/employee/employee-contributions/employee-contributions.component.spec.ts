import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeContributionsComponent } from './employee-contributions.component';

describe('EmployeeContributionsComponent', () => {
  let component: EmployeeContributionsComponent;
  let fixture: ComponentFixture<EmployeeContributionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeContributionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
