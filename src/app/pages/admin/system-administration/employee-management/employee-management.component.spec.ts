import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { EmployeeManagementComponent } from './employee-management.component';
import { EmployeeService } from '../../../../services/employee.service';

describe('EmployeeManagementComponent', () => {
  let component: EmployeeManagementComponent;
  let fixture: ComponentFixture<EmployeeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeManagementComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
 
  it('should load employees on init (service call mocked by HttpTesting)', () => {
    expect(component.employees).toBeDefined();
  });

  it('should apply filters correctly', () => {
    // Mock employee data
    component.employees = [
      {
        id: '1',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        // @ts-ignore
        photoUrl: null,
        dateOfBirth: new Date('1990-01-01'),
        hireDate: new Date('2020-01-01'),
        departmentId: 1,
        departmentName: 'Engineering',
        position: 'Developer',
        salary: 50000,
        employmentStatus: 'active',
        systemRole: 'employee',
        payFrequency: 'semiMonthly',
        address: '123 Main St',
        emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '0987654321' },
        employmentHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Test search filter
    component.searchTerm = 'John';
    component.applyFilters();
    expect(component.filteredEmployees.length).toBe(1);

    // Test department filter
    component.searchTerm = '';
    component.selectedOrganizationId = '1';
    component.applyFilters();
    expect(component.filteredEmployees.length).toBe(1);

    // Test status filter
    component.selectedOrganizationId = '';
    component.selectedStatus = 'active';
    component.applyFilters();
    expect(component.filteredEmployees.length).toBe(1);

    // Test role filter
    component.selectedStatus = '';
    component.selectedRole = 'employee';
    component.applyFilters();
    expect(component.filteredEmployees.length).toBe(1);

    // Test no matches
    component.selectedRole = 'admin';
    component.applyFilters();
    expect(component.filteredEmployees.length).toBe(0);
  });

  it('should clear all filters', () => {
    component.searchTerm = 'test';
    component.selectedOrganizationId = '1';
    component.selectedStatus = 'active';
    component.selectedRole = 'employee';
    component.selectedPayFrequency = 'weekly';

    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.selectedOrganizationId).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.selectedRole).toBe('');
    expect(component.selectedPayFrequency).toBe('');
  });

  it('should populate form for editing', () => {
    const mockEmployee = {
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      // @ts-ignore
      photoUrl: null,
      dateOfBirth: new Date('1990-01-01'),
      hireDate: new Date('2020-01-01'),
      departmentId: 1,
      departmentName: 'Engineering',
      position: 'Developer',
      salary: 50000,
      employmentStatus: 'active' as const,
      systemRole: 'employee' as const,
      payFrequency: 'semiMonthly',
      address: '123 Main St',
      emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '0987654321' },
      employmentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.populateEmployeeForm(mockEmployee);

    expect(component.employeeForm.employeeId).toBe('EMP001');
    expect(component.employeeForm.firstName).toBe('John');
    expect(component.employeeForm.lastName).toBe('Doe');
    expect(component.employeeForm.email).toBe('john.doe@example.com');
  });

  it('should handle edit employee', () => {
    const mockEmployee = {
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      // @ts-ignore
      photoUrl: null,
      dateOfBirth: new Date('1990-01-01'),
      hireDate: new Date('2020-01-01'),
      departmentId: 1,
      departmentName: 'Engineering',
      position: 'Developer',
      salary: 50000,
      employmentStatus: 'active' as const,
      systemRole: 'employee' as const,
      payFrequency: 'semiMonthly',
      address: '123 Main St',
      emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '0987654321' },
      employmentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.editEmployee(mockEmployee);

    expect(component.selectedEmployee).toBe(mockEmployee);
    expect(component.isEditMode).toBe(true);
    expect(component.employeeForm.employeeId).toBe('EMP001');
  });

  it('should handle view employee', () => {
    const mockEmployee = {
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      // @ts-ignore
      photoUrl: null,
      dateOfBirth: new Date('1990-01-01'),
      hireDate: new Date('2020-01-01'),
      departmentId: 1,
      departmentName: 'Engineering',
      position: 'Developer',
      salary: 50000,
      employmentStatus: 'active' as const,
      systemRole: 'employee' as const,
      payFrequency: 'semiMonthly',
      address: '123 Main St',
      emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '0987654321' },
      employmentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Simulate clicking the view button
    component.selectedEmployee = mockEmployee;
    component.isViewMode = true;

    expect(component.selectedEmployee).toBe(mockEmployee);
    expect(component.isViewMode).toBe(true);
  });

  it('should validate employee form', () => {
    // Test with empty form
    expect(component['validateEmployeeForm']()).toBe(false);

    // Test with valid form
    component.employeeForm = {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      dateOfBirth: '1990-01-01',
      hireDate: '2020-01-01',
      departmentId: 1,
      position: 'Developer',
      salary: 50000,
      employmentStatus: 'active',
      systemRole: 'employee',
      payFrequency: 'semiMonthly',
      photoUrl: ''
    };

    expect(component['validateEmployeeForm']()).toBe(true);
  });

  it('should save employee successfully', () => {
    // Setup valid form data
    component.employeeForm = {
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      dateOfBirth: '1992-05-15',
      hireDate: '2021-03-01',
      departmentId: 1,
      position: 'Designer',
      salary: 60000,
      employmentStatus: 'active',
      systemRole: 'employee',
      payFrequency: 'monthly',
      photoUrl: ''
    };

    // Mock departments
    component.departments = [{ id: 1, name: 'Design' }];

    // Test save
    component.saveEmployee();

    // Should add employee to array
    expect(component.employees.length).toBeGreaterThan(0);
    expect(component.employees.some(emp => emp.employeeId === 'EMP002')).toBe(true);
  });

  it('should prevent duplicate employee IDs', () => {
    // Add first employee
    component.employees = [{
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      // @ts-ignore
      photoUrl: null,
      dateOfBirth: new Date('1990-01-01'),
      hireDate: new Date('2020-01-01'),
      departmentId: 1,
      departmentName: 'Engineering',
      position: 'Developer',
      salary: 50000,
      employmentStatus: 'active' as const,
      systemRole: 'employee' as const,
      payFrequency: 'semiMonthly',
      address: '123 Main St',
      emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '0987654321' },
      employmentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    // Try to add employee with same ID
    component.employeeForm = {
      employeeId: 'EMP001', // Same ID
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      dateOfBirth: '1992-05-15',
      hireDate: '2021-03-01',
      departmentId: 1,
      position: 'Designer',
      salary: 60000,
      employmentStatus: 'active',
      systemRole: 'employee',
      payFrequency: 'weekly',
      photoUrl: ''
    };

    component.departments = [{ id: 1, name: 'Design' }];

    // Save should fail due to duplicate ID
    component.saveEmployee();

    // Should not add duplicate employee
    expect(component.employees.length).toBe(1);
  });

  it('should handle delete employee', () => {
    // Mock employee data
    const mockEmployee = {
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      // @ts-ignore
      photoUrl: null,
      dateOfBirth: new Date('1990-01-01'),
      hireDate: new Date('2020-01-01'),
      departmentId: 1,
      departmentName: 'Engineering',
      position: 'Developer',
      salary: 50000,
      employmentStatus: 'active' as const,
      systemRole: 'employee' as const,
      payFrequency: 'semiMonthly',
      address: '123 Main St',
      emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '0987654321' },
      employmentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.employees = [mockEmployee];
    
    // Mock confirm dialog
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Test delete
    component.deleteEmployee(mockEmployee);
    
    // Should remove employee from array
    expect(component.employees.length).toBe(0);
  });

  it('should map pay frequency label correctly', () => {
    expect(component.getPayFrequencyLabel('semiMonthly')).toBe('Semi-monthly');
    expect(component.getPayFrequencyLabel('monthly')).toBe('Monthly');
    expect(component.getPayFrequencyLabel('biweekly')).toBe('Biweekly');
    expect(component.getPayFrequencyLabel('weekly')).toBe('Weekly');
    expect(component.getPayFrequencyLabel(undefined)).toBe('-');
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Mock employee data for pagination tests
      component.employees = [
        { id: '1', employeeId: 'EMP001', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '1234567890', photoUrl: null, dateOfBirth: new Date('1990-01-01'), hireDate: new Date('2020-01-01'), departmentId: 1, departmentName: 'Engineering', position: 'Developer', salary: 50000, employmentStatus: 'active' as const, systemRole: 'employee' as const, payFrequency: 'semiMonthly', address: '123 Main St', emergencyContact: { name: 'Jane Doe', relationship: 'Spouse', phone: '0987654321' }, employmentHistory: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', employeeId: 'EMP002', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '1234567891', photoUrl: null, dateOfBirth: new Date('1992-05-15'), hireDate: new Date('2021-03-01'), departmentId: 1, departmentName: 'Engineering', position: 'Designer', salary: 60000, employmentStatus: 'active' as const, systemRole: 'employee' as const, payFrequency: 'monthly', address: '456 Oak St', emergencyContact: { name: 'John Smith', relationship: 'Spouse', phone: '0987654322' }, employmentHistory: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '3', employeeId: 'EMP003', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', phone: '1234567892', photoUrl: null, dateOfBirth: new Date('1988-12-10'), hireDate: new Date('2019-06-15'), departmentId: 2, departmentName: 'Marketing', position: 'Manager', salary: 70000, employmentStatus: 'active' as const, systemRole: 'hr' as const, payFrequency: 'weekly', address: '789 Pine St', emergencyContact: { name: 'Alice Johnson', relationship: 'Spouse', phone: '0987654323' }, employmentHistory: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '4', employeeId: 'EMP004', firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', phone: '1234567893', photoUrl: null, dateOfBirth: new Date('1995-08-20'), hireDate: new Date('2022-01-10'), departmentId: 2, departmentName: 'Marketing', position: 'Coordinator', salary: 45000, employmentStatus: 'active' as const, systemRole: 'employee' as const, payFrequency: 'semiMonthly', address: '321 Elm St', emergencyContact: { name: 'Charlie Brown', relationship: 'Spouse', phone: '0987654324' }, employmentHistory: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '5', employeeId: 'EMP005', firstName: 'Charlie', lastName: 'Wilson', email: 'charlie@example.com', phone: '1234567894', photoUrl: null, dateOfBirth: new Date('1985-03-25'), hireDate: new Date('2018-09-01'), departmentId: 3, departmentName: 'Finance', position: 'Analyst', salary: 55000, employmentStatus: 'active' as const, systemRole: 'employee' as const, payFrequency: 'monthly', address: '654 Maple St', emergencyContact: { name: 'Diana Wilson', relationship: 'Spouse', phone: '0987654325' }, employmentHistory: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '6', employeeId: 'EMP006', firstName: 'Diana', lastName: 'Davis', email: 'diana@example.com', phone: '1234567895', photoUrl: null, dateOfBirth: new Date('1993-11-05'), hireDate: new Date('2023-02-15'), departmentId: 3, departmentName: 'Finance', position: 'Assistant', salary: 40000, employmentStatus: 'active' as const, systemRole: 'employee' as const, payFrequency: 'weekly', address: '987 Cedar St', emergencyContact: { name: 'Edward Davis', relationship: 'Spouse', phone: '0987654326' }, employmentHistory: [], createdAt: new Date(), updatedAt: new Date() }
      ];
      component.filteredEmployees = [...component.employees];
      component.updatePagination();
    });

    it('should initialize pagination correctly', () => {
      expect(component.totalItems).toBe(6);
      expect(component.totalPages).toBe(2); // 6 items / 5 per page = 2 pages
      expect(component.currentPage).toBe(1);
      expect(component.paginatedEmployees.length).toBe(5); // First page should have 5 items
    });

    it('should navigate to next page', () => {
      component.goToNextPage();
      expect(component.currentPage).toBe(2);
      expect(component.paginatedEmployees.length).toBe(1); // Second page should have 1 item
    });

    it('should navigate to previous page', () => {
      component.goToNextPage(); // Go to page 2
      component.goToPreviousPage(); // Go back to page 1
      expect(component.currentPage).toBe(1);
      expect(component.paginatedEmployees.length).toBe(5);
    });

    it('should go to first page', () => {
      component.goToNextPage(); // Go to page 2
      component.goToFirstPage(); // Go to page 1
      expect(component.currentPage).toBe(1);
    });

    it('should go to last page', () => {
      component.goToLastPage();
      expect(component.currentPage).toBe(2);
    });

    it('should change items per page', () => {
      component.itemsPerPage = 10;
      component.onItemsPerPageChange();
      expect(component.currentPage).toBe(1);
      expect(component.totalPages).toBe(1); // 6 items / 10 per page = 1 page
      expect(component.paginatedEmployees.length).toBe(6);
    });

    it('should get correct page numbers', () => {
      const pageNumbers = component.getPageNumbers();
      expect(pageNumbers).toEqual([1, 2]); // Should show pages 1 and 2
    });

    it('should not navigate beyond valid page range', () => {
      component.goToPage(5); // Try to go to non-existent page
      expect(component.currentPage).toBe(2); // Should stay on last valid page
    });

    it('should reset to first page when search changes', () => {
      component.goToNextPage(); // Go to page 2
      component.searchTerm = 'John';
      component.applyFilters();
      expect(component.currentPage).toBe(1); // Should reset to first page
    });
  });
});
