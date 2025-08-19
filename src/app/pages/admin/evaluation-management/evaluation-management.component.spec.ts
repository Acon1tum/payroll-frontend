import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { EvaluationManagementComponent } from './evaluation-management.component';
import { EvaluationService, EvaluationForm } from '../../../services/evaluation.service';

describe('EvaluationManagementComponent', () => {
  let component: EvaluationManagementComponent;
  let fixture: ComponentFixture<EvaluationManagementComponent>;
  let mockEvaluationService: jasmine.SpyObj<EvaluationService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockEvaluationForms: EvaluationForm[] = [
    {
      id: '1',
      title: 'Test Form 1',
      description: 'Test Description 1',
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdById: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [],
      targets: [],
      responses: []
    },
    {
      id: '2',
      title: 'Test Form 2',
      description: 'Test Description 2',
      isActive: false,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdById: 'user2',
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [],
      targets: [],
      responses: []
    }
  ];

  beforeEach(async () => {
    mockEvaluationService = jasmine.createSpyObj('EvaluationService', [
      'getAllEvaluationForms',
      'createEvaluationForm',
      'updateEvaluationForm',
      'deleteEvaluationForm',
      'getQuestionTypeLabel'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ EvaluationManagementComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: EvaluationService, useValue: mockEvaluationService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluationManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load evaluation forms on init', () => {
    mockEvaluationService.getAllEvaluationForms.and.returnValue(of(mockEvaluationForms));

    fixture.detectChanges();

    expect(mockEvaluationService.getAllEvaluationForms).toHaveBeenCalled();
    expect(component.evaluationForms).toEqual(mockEvaluationForms);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading forms fails', () => {
    const errorMessage = 'Failed to load forms';
    mockEvaluationService.getAllEvaluationForms.and.returnValue(throwError(() => new Error(errorMessage)));

    fixture.detectChanges();

    expect(component.error).toBe('Failed to load evaluation forms');
    expect(component.loading).toBeFalse();
  });

  it('should open create form modal', () => {
    component.openCreateForm();

    expect(component.showCreateForm).toBeTrue();
    expect(component.formData.title).toBe('');
    expect(component.formData.description).toBe('');
  });

  it('should open edit form modal', () => {
    const formToEdit = mockEvaluationForms[0];
    component.openEditForm(formToEdit);

    expect(component.showEditForm).toBeTrue();
    expect(component.editingForm).toBe(formToEdit);
    expect(component.formData.title).toBe(formToEdit.title);
    expect(component.formData.description).toBe(formToEdit.description);
  });

  it('should close forms modal', () => {
    component.showCreateForm = true;
    component.showEditForm = true;
    component.editingForm = mockEvaluationForms[0];

    component.closeForms();

    expect(component.showCreateForm).toBeFalse();
    expect(component.showEditForm).toBeFalse();
    expect(component.editingForm).toBeNull();
  });

  it('should add question to form', () => {
    component.currentQuestion.questionText = 'Test Question';
    component.currentQuestion.questionType = 'multipleChoice';
    component.currentQuestion.isRequired = true;

    component.addQuestion();

    expect(component.formData.questions.length).toBe(1);
    expect(component.formData.questions[0].questionText).toBe('Test Question');
    expect(component.formData.questions[0].questionType).toBe('multipleChoice');
    expect(component.formData.questions[0].isRequired).toBeTrue();
  });

  it('should not add question without text', () => {
    component.currentQuestion.questionText = '';

    component.addQuestion();

    expect(component.formData.questions.length).toBe(0);
  });

  it('should remove question from form', () => {
    component.formData.questions = [
      { questionText: 'Q1', questionType: 'text', isRequired: false, order: 1 },
      { questionText: 'Q2', questionType: 'text', isRequired: false, order: 2 }
    ];

    component.removeQuestion(0);

    expect(component.formData.questions.length).toBe(1);
    expect(component.formData.questions[0].questionText).toBe('Q2');
    expect(component.formData.questions[0].order).toBe(1);
  });

  it('should add option to question', () => {
    component.addOption();

    expect(component.currentQuestion.options.length).toBe(2);
    expect(component.currentQuestion.options[1].order).toBe(2);
  });

  it('should remove option from question', () => {
    component.currentQuestion.options = [
      { optionText: 'Option 1', score: 0, order: 1 },
      { optionText: 'Option 2', score: 0, order: 2 }
    ];

    component.removeOption(0);

    expect(component.currentQuestion.options.length).toBe(1);
    expect(component.currentQuestion.options[0].optionText).toBe('Option 2');
    expect(component.currentQuestion.options[0].order).toBe(1);
  });

  it('should validate form correctly', () => {
    // Test valid form
    component.formData.title = 'Test Title';
    component.formData.description = 'Test Description';
    component.formData.startDate = new Date('2024-01-01');
    component.formData.endDate = new Date('2024-12-31');
    component.formData.questions = [{ questionText: 'Test Q', questionType: 'text', isRequired: false, order: 1 }];

    expect(component.validateForm()).toBeTrue();
    expect(component.error).toBe('');

    // Test invalid form - missing title
    component.formData.title = '';
    expect(component.validateForm()).toBeFalse();
    expect(component.error).toBe('Form title is required');

    // Test invalid form - missing description
    component.formData.title = 'Test Title';
    component.formData.description = '';
    expect(component.validateForm()).toBeFalse();
    expect(component.error).toBe('Form description is required');

    // Test invalid form - invalid dates
    component.formData.description = 'Test Description';
    component.formData.startDate = new Date('2024-12-31');
    component.formData.endDate = new Date('2024-01-01');
    expect(component.validateForm()).toBeFalse();
    expect(component.error).toBe('End date must be after start date');

    // Test invalid form - no questions
    component.formData.startDate = new Date('2024-01-01');
    component.formData.endDate = new Date('2024-12-31');
    component.formData.questions = [];
    expect(component.validateForm()).toBeFalse();
    expect(component.error).toBe('At least one question is required');
  });

  it('should get form status correctly', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

    // Active form
    const activeForm = { ...mockEvaluationForms[0], isActive: true, startDate: pastDate, endDate: futureDate };
    expect(component.getFormStatus(activeForm)).toBe('Active');

    // Pending form
    const pendingForm = { ...mockEvaluationForms[0], isActive: true, startDate: futureDate, endDate: futureDate };
    expect(component.getFormStatus(pendingForm)).toBe('Pending');

    // Expired form
    const expiredForm = { ...mockEvaluationForms[0], isActive: true, startDate: pastDate, endDate: pastDate };
    expect(component.getFormStatus(expiredForm)).toBe('Expired');

    // Inactive form
    const inactiveForm = { ...mockEvaluationForms[0], isActive: false, startDate: pastDate, endDate: futureDate };
    expect(component.getFormStatus(inactiveForm)).toBe('Inactive');
  });

  it('should get form status color correctly', () => {
    expect(component.getFormStatusColor('Active')).toBe('success');
    expect(component.getFormStatusColor('Pending')).toBe('warning');
    expect(component.getFormStatusColor('Expired')).toBe('danger');
    expect(component.getFormStatusColor('Inactive')).toBe('secondary');
    expect(component.getFormStatusColor('Unknown')).toBe('secondary');
  });

  it('should get response count correctly', () => {
    const formWithResponses = { 
      ...mockEvaluationForms[0], 
      responses: [
        { 
          id: '1', 
          formId: '1', 
          employeeId: 'emp1', 
          status: 'submitted' as const, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }, 
        { 
          id: '2', 
          formId: '1', 
          employeeId: 'emp2', 
          status: 'approved' as const, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        } 
      ] 
    };
    expect(component.getResponseCount(formWithResponses)).toBe(2);

    const formWithoutResponses = { ...mockEvaluationForms[0], responses: [] };
    expect(component.getResponseCount(formWithoutResponses)).toBe(0);

    const formWithNoResponses = { ...mockEvaluationForms[0] };
    expect(component.getResponseCount(formWithNoResponses)).toBe(0);
  });

  it('should get completion rate correctly', () => {
    const formWithTargetsAndResponses = {
      ...mockEvaluationForms[0],
      targets: [
        { id: '1', formId: '1', employeeId: 'emp1', assignedAt: new Date() },
        { id: '2', formId: '1', employeeId: 'emp2', assignedAt: new Date() },
        { id: '3', formId: '1', employeeId: 'emp3', assignedAt: new Date() }
      ],
      responses: [
        { 
          id: '1', 
          formId: '1', 
          employeeId: 'emp1', 
          status: 'submitted' as const, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        { 
          id: '2', 
          formId: '1', 
          employeeId: 'emp2', 
          status: 'approved' as const, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      ]
    };
    expect(component.getCompletionRate(formWithTargetsAndResponses)).toBe(67);

    const formWithNoTargets = { ...mockEvaluationForms[0], targets: [] };
    expect(component.getCompletionRate(formWithNoTargets)).toBe(0);

    const formWithNoTargetsProperty = { ...mockEvaluationForms[0] };
    expect(component.getCompletionRate(formWithNoTargetsProperty)).toBe(0);
  });

  it('should navigate to form details', () => {
    const form = mockEvaluationForms[0];
    component.viewFormDetails(form);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/evaluation', form.id]);
  });

  it('should navigate to form responses', () => {
    const form = mockEvaluationForms[0];
    component.viewResponses(form);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/evaluation', form.id, 'responses']);
  });

  it('should get question type label from service', () => {
    mockEvaluationService.getQuestionTypeLabel.and.returnValue('Multiple Choice');
    
    const result = component.getQuestionTypeLabel('multipleChoice');
    
    expect(mockEvaluationService.getQuestionTypeLabel).toHaveBeenCalledWith('multipleChoice');
    expect(result).toBe('Multiple Choice');
  });

  it('should reset form data correctly', () => {
    component.formData.title = 'Test Title';
    component.formData.description = 'Test Description';
    component.formData.questions = [{ questionText: 'Test Q', questionType: 'text', isRequired: false, order: 1 }];
    component.currentQuestion.questionText = 'Test Question';

    component.resetFormData();

    expect(component.formData.title).toBe('');
    expect(component.formData.description).toBe('');
    expect(component.formData.questions.length).toBe(0);
    expect(component.currentQuestion.questionText).toBe('');
  });

  it('should handle form submission for create', () => {
    spyOn(component, 'validateForm').and.returnValue(true);
    mockEvaluationService.createEvaluationForm.and.returnValue(of(mockEvaluationForms[0]));
    spyOn(component, 'loadEvaluationForms');
    spyOn(component, 'closeForms');

    component.showCreateForm = true;
    component.submitForm();

    expect(mockEvaluationService.createEvaluationForm).toHaveBeenCalledWith(component.formData);
    expect(component.loading).toBeFalse();
    expect(component.loadEvaluationForms).toHaveBeenCalled();
    expect(component.closeForms).toHaveBeenCalled();
  });

  it('should handle form submission for edit', () => {
    spyOn(component, 'validateForm').and.returnValue(true);
    mockEvaluationService.updateEvaluationForm.and.returnValue(of(mockEvaluationForms[0]));
    spyOn(component, 'loadEvaluationForms');
    spyOn(component, 'closeForms');

    component.showEditForm = true;
    component.editingForm = mockEvaluationForms[0];
    component.submitForm();

    expect(mockEvaluationService.updateEvaluationForm).toHaveBeenCalledWith(mockEvaluationForms[0].id, component.formData);
    expect(component.loading).toBeFalse();
    expect(component.loadEvaluationForms).toHaveBeenCalled();
    expect(component.closeForms).toHaveBeenCalled();
  });

  it('should handle form submission error', () => {
    spyOn(component, 'validateForm').and.returnValue(true);
    mockEvaluationService.createEvaluationForm.and.returnValue(throwError(() => new Error('Test error')));
    spyOn(console, 'error');

    component.showCreateForm = true;
    component.submitForm();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Failed to create evaluation form');
    expect(console.error).toHaveBeenCalled();
  });

  it('should not submit form if validation fails', () => {
    spyOn(component, 'validateForm').and.returnValue(false);
    spyOn(mockEvaluationService, 'createEvaluationForm');

    component.submitForm();

    expect(mockEvaluationService.createEvaluationForm).not.toHaveBeenCalled();
  });

  it('should delete form with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockEvaluationService.deleteEvaluationForm.and.returnValue(of(void 0));
    spyOn(component, 'loadEvaluationForms');

    component.deleteForm('form1');

    expect(mockEvaluationService.deleteEvaluationForm).toHaveBeenCalledWith('form1');
    expect(component.loadEvaluationForms).toHaveBeenCalled();
  });

  it('should not delete form without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(mockEvaluationService, 'deleteEvaluationForm');

    component.deleteForm('form1');

    expect(mockEvaluationService.deleteEvaluationForm).not.toHaveBeenCalled();
  });

  it('should handle delete form error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockEvaluationService.deleteEvaluationForm.and.returnValue(throwError(() => new Error('Test error')));
    spyOn(console, 'error');

    component.deleteForm('form1');

    expect(component.error).toBe('Failed to delete evaluation form');
    expect(console.error).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
