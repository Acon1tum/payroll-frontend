import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { OrgManagementComponent } from './org-management.component';
import { OrganizationService } from '../../../../services/organization.service';

describe('OrgManagementComponent', () => {
  let component: OrgManagementComponent;
  let fixture: ComponentFixture<OrgManagementComponent>;
  let organizationService: jasmine.SpyObj<OrganizationService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('OrganizationService', [
      'getOrganizations',
      'getOrganization',
      'createOrganization',
      'updateOrganization',
      'deleteOrganization',
      'toggleOrganizationStatus',
      'checkDuplicateOrganization'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        OrgManagementComponent,
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        { provide: OrganizationService, useValue: spy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgManagementComponent);
    component = fixture.componentInstance;
    organizationService = TestBed.inject(OrganizationService) as jasmine.SpyObj<OrganizationService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty data', () => {
    expect(component.organizations).toEqual([]);
    expect(component.filteredOrganizations).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  it('should load data on init', () => {
    spyOn(component, 'loadOrganizations');
    component.ngOnInit();
    expect(component.loadOrganizations).toHaveBeenCalled();
  });

  it('should toggle sidebar', () => {
    const initialState = component.isSidebarCollapsed;
    component.toggleSidebar();
    expect(component.isSidebarCollapsed).toBe(!initialState);
  });

  it('should clear messages', () => {
    component.errorMessage = 'Test error';
    component.successMessage = 'Test success';
    component.nameValidationMessage = { message: 'Test validation', isError: false };
    component.tinValidationMessage = { message: 'Test validation', isError: false };
    
    component.clearMessages();
    
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
    expect(component.nameValidationMessage).toBeNull();
    expect(component.tinValidationMessage).toBeNull();
  });

  it('should clear validation messages', () => {
    component.nameValidationMessage = { message: 'Test validation', isError: false };
    component.tinValidationMessage = { message: 'Test validation', isError: false };
    
    component.clearValidationMessages();
    
    expect(component.nameValidationMessage).toBeNull();
    expect(component.tinValidationMessage).toBeNull();
  });

  it('should add organization', () => {
    component.addOrganization();
    
    expect(component.isAddMode).toBeTrue();
    expect(component.isEditMode).toBeFalse();
    expect(component.selectedOrganization).toBeNull();
  });

  it('should edit organization', () => {
    const mockOrg = {
      id: '1',
      name: 'Test Org',
      tin: '123456789',
      address: 'Test Address',
      contact: 'Test Contact',
      email: 'test@test.com',
      phone: '1234567890',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    component.editOrganization(mockOrg);
    
    expect(component.isEditMode).toBeTrue();
    expect(component.isAddMode).toBeFalse();
    expect(component.selectedOrganization).toBe(mockOrg);
    expect(component.organizationForm.name).toBe('Test Org');
  });

  it('should cancel edit', () => {
    component.isAddMode = true;
    component.isEditMode = true;
    component.selectedOrganization = { id: '1', name: 'Test', tin: '123', address: 'Test', contact: 'Test', email: 'test@test.com', status: 'active', createdAt: new Date(), updatedAt: new Date() };
    
    component.cancelEdit();
    
    expect(component.isAddMode).toBeFalse();
    expect(component.isEditMode).toBeFalse();
    expect(component.selectedOrganization).toBeNull();
  });

  it('should search organizations', () => {
    component.organizations = [
      { id: '1', name: 'Test Org', tin: '123', address: 'Test', contact: 'Test', email: 'test@test.com', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Another Org', tin: '456', address: 'Test', contact: 'Test', email: 'another@test.com', status: 'active', createdAt: new Date(), updatedAt: new Date() }
    ];
    component.filteredOrganizations = [...component.organizations];
    
    component.searchTerm = 'Test';
    component.searchOrganizations();
    
    expect(component.filteredOrganizations.length).toBe(2);
    
    component.searchTerm = 'Another';
    component.searchOrganizations();
    
    expect(component.filteredOrganizations.length).toBe(1);
    expect(component.filteredOrganizations[0].name).toBe('Another Org');
  });

  it('should validate organization name', () => {
    const mockResponse = { 
      success: true, 
      isDuplicate: false, 
      duplicates: [],
      message: 'Organization name is available'
    };
    (organizationService.checkDuplicateOrganization as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    component.organizationForm.name = 'Test Organization';
    
    component.validateOrganizationName();
    
    expect(organizationService.checkDuplicateOrganization).toHaveBeenCalledWith('Test Organization', undefined, undefined);
    expect(component.nameValidationMessage).toEqual({
      message: 'Organization name is available',
      isError: false
    });
  });

  it('should validate organization TIN', () => {
    const mockResponse = { 
      success: true, 
      isDuplicate: false, 
      duplicates: [],
      message: 'TIN is available'
    };
    (organizationService.checkDuplicateOrganization as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    component.organizationForm.tin = '123456789';
    
    component.validateOrganizationTIN();
    
    expect(organizationService.checkDuplicateOrganization).toHaveBeenCalledWith(undefined, '123456789', undefined);
    expect(component.tinValidationMessage).toEqual({
      message: 'TIN is available',
      isError: false
    });
  });

  it('should show error for duplicate name validation', () => {
    const mockResponse = { 
      success: true, 
      isDuplicate: true, 
      duplicates: [{ field: 'name', message: 'An organization with the name "Test" already exists' }],
      message: 'Duplicate organization found'
    };
    (organizationService.checkDuplicateOrganization as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    component.organizationForm.name = 'Test';
    
    component.validateOrganizationName();
    
    expect(component.nameValidationMessage).toEqual({
      message: 'An organization with the name "Test" already exists',
      isError: true
    });
  });

  it('should show error for duplicate TIN validation', () => {
    const mockResponse = { 
      success: true, 
      isDuplicate: true, 
      duplicates: [{ field: 'tin', message: 'An organization with TIN "123456789" already exists' }],
      message: 'Duplicate organization found'
    };
    (organizationService.checkDuplicateOrganization as jasmine.Spy).and.returnValue({
      subscribe: (fn: any) => fn.next(mockResponse)
    } as any);

    component.organizationForm.tin = '123456789';
    
    component.validateOrganizationTIN();
    
    expect(component.tinValidationMessage).toEqual({
      message: 'An organization with TIN "123456789" already exists',
      isError: true
    });
  });
});
