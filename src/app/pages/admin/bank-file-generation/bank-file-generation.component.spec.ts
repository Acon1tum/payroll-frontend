import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankFileGenerationComponent } from './bank-file-generation.component';

describe('BankFileGenerationComponent', () => {
  let component: BankFileGenerationComponent;
  let fixture: ComponentFixture<BankFileGenerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BankFileGenerationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankFileGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
