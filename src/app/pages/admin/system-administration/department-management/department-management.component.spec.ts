import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { DepartmentManagementComponent } from './department-management.component';
import { DepartmentService } from '../../../../services/department.service';

describe('DepartmentManagementComponent', () => {
  let component: DepartmentManagementComponent;
  let fixture: ComponentFixture<DepartmentManagementComponent>;
  let departmentService: jasmine.SpyObj<DepartmentService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DepartmentService', [
      'getDepartments',
      'getOrganizations',
      'getAvailableEmployees',
      'createDepartment',
      'updateDepartment',
      'deleteDepartment',
      'assignDepartmentHead',
      'toggleDepartmentStatus',
      'checkDuplicateDepartmentName'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        DepartmentManagementComponent,
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        { provide: DepartmentService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentManagementComponent);
    component = fixture.componentInstance;
    departmentService = TestBed.inject(DepartmentService) as jasmine.SpyObj<DepartmentService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty data', () => {
    expect(component.departments).toEqual([]);
    expect(component.organizations).toEqual([]);
    expect(component.employees).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  it('should load data on init', () => {
    spyOn(component, 'loadData');
    component.ngOnInit();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should toggle sidebar', () => {
    const initialState = component.isSidebarCollapsed;
    component.toggleSidebar();
    expect(component.isSidebarCollapsed).toBe(!initialState);
  });

  it('should clear messages', () => {
    component.errorMessage = 'Test error';
    component.successMessage = 'Test success';
    component.clearMessages();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('should close modal', () => {
    component.isAddMode = true;
    component.isEditMode = false;
    component.isAssignHeadMode = false;
    component.selectedDepartment = { id: '1', name: 'Test', organizationId: '1', organizationName: 'Test Org', memberCount: 0, description: '', status: 'active', createdAt: new Date(), updatedAt: new Date() };
    
    component.closeModal();
    
    expect(component.isAddMode).toBeFalse();
    expect(component.isEditMode).toBeFalse();
    expect(component.isAssignHeadMode).toBeFalse();
    expect(component.selectedDepartment).toBeNull();
  });

  it('should handle modal close for different modes', () => {
    // Test Add Mode
    component.isAddMode = true;
    component.closeModal();
    expect(component.isAddMode).toBeFalse();
    
    // Test Edit Mode
    component.isEditMode = true;
    component.closeModal();
    expect(component.isEditMode).toBeFalse();
    
    // Test Assign Head Mode
    component.isAssignHeadMode = true;
    component.closeModal();
    expect(component.isAssignHeadMode).toBeFalse();
  });

  it('should check for duplicate department names before saving', () => {
    // Mock the checkDuplicateDepartmentName method
    const mockResponse = { success: true, isDuplicate: false, message: 'Department name is available' };
    (departmentService.checkDuplicateDepartmentName as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    // Test with valid data
    component.departmentForm.name = 'Test Department';
    component.departmentForm.organizationId = '1';
    component.isAddMode = true;

    // Spy on the actual save method
    spyOn(component, 'saveDepartment').and.callThrough();
    
    component.saveDepartment();
    
    expect(departmentService.checkDuplicateDepartmentName).toHaveBeenCalledWith(
      'Test Department', '1', undefined
    );
  });

  it('should prevent saving when duplicate department name is found', () => {
    // Mock duplicate found response
    const mockResponse = { 
      success: true, 
      isDuplicate: true, 
      message: 'A department with this name already exists in this organization' 
    };
    (departmentService.checkDuplicateDepartmentName as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    // Test with duplicate name
    component.departmentForm.name = 'Duplicate Department';
    component.departmentForm.organizationId = '1';
    component.isAddMode = true;

    // Spy on the actual save method
    spyOn(component, 'saveDepartment').and.callThrough();
    
    component.saveDepartment();
    
    expect(departmentService.checkDuplicateDepartmentName).toHaveBeenCalledWith(
      'Duplicate Department', '1', undefined
    );
    // Should not call createDepartment when duplicate is found
    expect(departmentService.createDepartment).not.toHaveBeenCalled();
  });

  it('should handle duplicate check errors gracefully', () => {
    // Mock error response
    const mockError = { status: 500, message: 'Server error' };
    (departmentService.checkDuplicateDepartmentName as jasmine.Spy).and.returnValue({
      subscribe: (fn: any, errorFn: any) => errorFn(mockError)
    } as any);

    // Test with error in duplicate check
    component.departmentForm.name = 'Test Department';
    component.departmentForm.organizationId = '1';
    component.isAddMode = true;

    // Spy on the actual save method
    spyOn(component, 'saveDepartment').and.callThrough();
    
    component.saveDepartment();
    
    expect(departmentService.checkDuplicateDepartmentName).toHaveBeenCalledWith(
      'Test Department', '1', undefined
    );
    // Should still try to save even if duplicate check fails
    expect(departmentService.createDepartment).toHaveBeenCalled();
  });

  it('should validate department name on blur', () => {
    // Mock successful validation response
    const mockResponse = { success: true, isDuplicate: false, message: 'Department name is available' };
    (departmentService.checkDuplicateDepartmentName as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    component.departmentForm.name = 'Test Department';
    component.departmentForm.organizationId = '1';
    
    component.validateDepartmentName();
    
    expect(departmentService.checkDuplicateDepartmentName).toHaveBeenCalledWith(
      'Test Department', '1', undefined
    );
    expect(component.nameValidationMessage).toEqual({
      message: 'Department name is available',
      isError: false
    });
  });

  it('should show error message for duplicate department names during validation', () => {
    // Mock duplicate found response
    const mockResponse = { 
      success: true, 
      isDuplicate: true, 
      message: 'A department with this name already exists in this organization' 
    };
    (departmentService.checkDuplicateDepartmentName as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    component.departmentForm.name = 'Duplicate Department';
    component.departmentForm.organizationId = '1';
    
    component.validateDepartmentName();
    
    expect(component.nameValidationMessage).toEqual({
      message: 'A department with this name already exists in this organization',
      isError: true
    });
  });

  it('should clear validation message when clearing messages', () => {
    component.nameValidationMessage = { message: 'Test validation', isError: false };
    component.errorMessage = 'Test error';
    component.successMessage = 'Test success';
    
    component.clearMessages();
    
    expect(component.nameValidationMessage).toBeNull();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('should not validate when name or organization is missing', () => {
    component.departmentForm.name = '';
    component.departmentForm.organizationId = null;
    
    component.validateDepartmentName();
    
    expect(component.nameValidationMessage).toBeNull();
    expect(departmentService.checkDuplicateDepartmentName).not.toHaveBeenCalled();
  });
});
