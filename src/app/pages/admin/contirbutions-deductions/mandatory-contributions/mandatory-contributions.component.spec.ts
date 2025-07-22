import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MandatoryContributionsComponent } from './mandatory-contributions.component';

describe('MandatoryContributionsComponent', () => {
  let component: MandatoryContributionsComponent;
  let fixture: ComponentFixture<MandatoryContributionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MandatoryContributionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MandatoryContributionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
