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
      'getEmployeesByDepartment',
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

  // Pagination Tests
  describe('Pagination', () => {
    beforeEach(() => {
      // Mock departments data
      component.departments = [
        { id: '1', name: 'Dept 1', organizationId: '1', organizationName: 'Org 1', memberCount: 5, description: '', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Dept 2', organizationId: '1', organizationName: 'Org 1', memberCount: 3, description: '', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Dept 3', organizationId: '1', organizationName: 'Org 1', memberCount: 7, description: '', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '4', name: 'Dept 4', organizationId: '1', organizationName: 'Org 1', memberCount: 2, description: '', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '5', name: 'Dept 5', organizationId: '1', organizationName: 'Org 1', memberCount: 4, description: '', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '6', name: 'Dept 6', organizationId: '1', organizationName: 'Org 1', memberCount: 6, description: '', status: 'active', createdAt: new Date(), updatedAt: new Date() }
      ];
      component.filteredDepartments = [...component.departments];
    });

    it('should initialize pagination correctly', () => {
      component.updatePagination();
      
      expect(component.totalItems).toBe(6);
      expect(component.totalPages).toBe(2); // 6 items / 5 per page = 2 pages
      expect(component.currentPage).toBe(1);
      expect(component.paginatedDepartments.length).toBe(5); // First page should have 5 items
    });

    it('should navigate to next page', () => {
      component.updatePagination();
      component.goToNextPage();
      
      expect(component.currentPage).toBe(2);
      expect(component.paginatedDepartments.length).toBe(1); // Second page should have 1 item
    });

    it('should navigate to previous page', () => {
      component.updatePagination();
      component.goToNextPage(); // Go to page 2
      component.goToPreviousPage(); // Go back to page 1
      
      expect(component.currentPage).toBe(1);
      expect(component.paginatedDepartments.length).toBe(5);
    });

    it('should go to first page', () => {
      component.updatePagination();
      component.goToNextPage(); // Go to page 2
      component.goToFirstPage(); // Go to page 1
      
      expect(component.currentPage).toBe(1);
    });

    it('should go to last page', () => {
      component.updatePagination();
      component.goToLastPage();
      
      expect(component.currentPage).toBe(2);
    });

    it('should change items per page', () => {
      component.updatePagination();
      component.itemsPerPage = 10;
      component.onItemsPerPageChange();
      
      expect(component.currentPage).toBe(1);
      expect(component.totalPages).toBe(1); // 6 items / 10 per page = 1 page
      expect(component.paginatedDepartments.length).toBe(6); // All items on one page
    });

    it('should get correct page numbers', () => {
      component.updatePagination();
      const pageNumbers = component.getPageNumbers();
      
      expect(pageNumbers).toEqual([1, 2]);
    });

    it('should not navigate beyond valid page range', () => {
      component.updatePagination();
      
      // Try to go to page 0
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
      
      // Try to go to page 3 (doesn't exist)
      component.goToPage(3);
      expect(component.currentPage).toBe(1);
    });

    it('should reset to first page when filter changes', () => {
      component.updatePagination();
      component.goToNextPage(); // Go to page 2
      component.onOrganizationFilterChange(); // Change filter
      
      expect(component.currentPage).toBe(1);
    });
  });

  // Department Employees Tests
  describe('Department Employees', () => {
    const mockDepartment = {
      id: '1',
      name: 'Test Department',
      organizationId: '1',
      organizationName: 'Test Org',
      memberCount: 3,
      description: '',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockEmployees = [
      {
        id: '1',
        employeeNumber: 'EMP001',
        name: 'John Doe',
        fullName: 'John Doe',
        position: 'Developer',
        baseSalary: 50000,
        hireDate: new Date('2023-01-01'),
        employmentStatus: 'active',
        photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
        createdAt: new Date()
      },
      {
        id: '2',
        employeeNumber: 'EMP002',
        name: 'Jane Smith',
        fullName: 'Jane Smith',
        position: 'Designer',
        baseSalary: 45000,
        hireDate: new Date('2023-02-01'),
        employmentStatus: 'active',
        photoUrl: undefined,
        createdAt: new Date()
      }
    ];

    it('should initialize department employees properties', () => {
      expect(component.isViewEmployeesMode).toBeFalse();
      expect(component.departmentEmployees).toEqual([]);
      expect(component.selectedDepartmentForEmployees).toBeNull();
      expect(component.isLoadingEmployees).toBeFalse();
    });

    it('should view department employees', () => {
      // Mock the service response
      const mockResponse = {
        success: true,
        data: {
          department: {
            id: '1',
            name: 'Test Department',
            organization: { id: '1', name: 'Test Org' }
          },
          employees: mockEmployees,
          totalCount: 2
        }
      };
      (departmentService.getEmployeesByDepartment as jasmine.Spy).and.returnValue({
        subscribe: (fn: any) => fn.next(mockResponse)
      } as any);

      component.viewDepartmentEmployees(mockDepartment);

      expect(component.isViewEmployeesMode).toBeTrue();
      expect(component.isAddMode).toBeFalse();
      expect(component.isEditMode).toBeFalse();
      expect(component.isAssignHeadMode).toBeFalse();
      expect(component.selectedDepartmentForEmployees).toEqual(mockDepartment);
      expect(departmentService.getEmployeesByDepartment).toHaveBeenCalledWith('1');
    });

    it('should load department employees successfully', () => {
      const mockResponse = {
        success: true,
        data: {
          department: {
            id: '1',
            name: 'Test Department',
            organization: { id: '1', name: 'Test Org' }
          },
          employees: mockEmployees,
          totalCount: 2
        }
      };
      (departmentService.getEmployeesByDepartment as jasmine.Spy).and.returnValue({
        subscribe: (fn: any) => fn.next(mockResponse)
      } as any);

      component.loadDepartmentEmployees('1');

      expect(component.isLoadingEmployees).toBeFalse();
      expect(component.departmentEmployees).toEqual(mockEmployees);
      expect(component.errorMessage).toBe('');
    });

    it('should handle error when loading department employees', () => {
      const mockError = { status: 500, message: 'Server error' };
      (departmentService.getEmployeesByDepartment as jasmine.Spy).and.returnValue({
        subscribe: (fn: any, errorFn: any) => errorFn(mockError)
      } as any);

      component.loadDepartmentEmployees('1');

      expect(component.isLoadingEmployees).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load department employees');
    });

    it('should close modal and reset department employees state', () => {
      component.isViewEmployeesMode = true;
      component.selectedDepartmentForEmployees = mockDepartment;
      component.departmentEmployees = mockEmployees;

      component.cancelEdit();

      expect(component.isViewEmployeesMode).toBeFalse();
      expect(component.selectedDepartmentForEmployees).toBeNull();
      expect(component.departmentEmployees).toEqual([]);
    });

    it('should handle image loading errors', () => {
      const mockEvent = {
        target: {
          style: {
            display: ''
          }
        }
      } as any;

      component.onImageError(mockEvent);

      expect(mockEvent.target.style.display).toBe('none');
    });

    it('should open employee photo in new window', () => {
      const employee = {
        id: '1',
        employeeNumber: 'EMP001',
        name: 'John Doe',
        fullName: 'John Doe',
        position: 'Developer',
        baseSalary: 50000,
        hireDate: new Date('2023-01-01'),
        employmentStatus: 'active',
        photoUrl: 'data:image/jpeg;base64,test',
        createdAt: new Date()
      };

      spyOn(window, 'open').and.returnValue({
        document: {
          write: jasmine.createSpy('write'),
          close: jasmine.createSpy('close')
        }
      } as any);

      component.viewEmployeePhoto(employee);

      expect(window.open).toHaveBeenCalledWith('', '_blank');
    });

    it('should not open window if employee has no photo', () => {
      const employee = {
        id: '1',
        employeeNumber: 'EMP001',
        name: 'John Doe',
        fullName: 'John Doe',
        position: 'Developer',
        baseSalary: 50000,
        hireDate: new Date('2023-01-01'),
        employmentStatus: 'active',
        photoUrl: undefined,
        createdAt: new Date()
      };

      spyOn(window, 'open');

      component.viewEmployeePhoto(employee);

      expect(window.open).not.toHaveBeenCalled();
    });
  });
});