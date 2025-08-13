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

    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.selectedOrganizationId).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.selectedRole).toBe('');
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
});
