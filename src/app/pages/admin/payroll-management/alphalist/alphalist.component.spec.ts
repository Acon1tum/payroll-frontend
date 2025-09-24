import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlphalistComponent } from './alphalist.component';

describe('AlphalistComponent', () => {
  let component: AlphalistComponent;
  let fixture: ComponentFixture<AlphalistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlphalistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlphalistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
