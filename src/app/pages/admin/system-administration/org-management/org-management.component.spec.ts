import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { OrgManagementComponent } from './org-management.component';
import { OrganizationService } from '../../../../services/organization.service';

describe('OrgManagementComponent', () => {
  let component: OrgManagementComponent;
  let fixture: ComponentFixture<OrgManagementComponent>;
  let httpMock: HttpTestingController;
  let organizationService: OrganizationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgManagementComponent, HttpClientTestingModule],
      providers: [OrganizationService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgManagementComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    organizationService = TestBed.inject(OrganizationService);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load organizations on init', () => {
    const mockOrganizations = [
      {
        id: '1',
        name: 'TechCorp Solutions',
        code: 'TECH001',
        tin: '123456789',
        address: '123 Business Ave, Tech City, TC 12345',
        contact: 'John Smith',
        email: 'contact@techcorp.com',
        phone: '+1 (555) 123-4567',
        status: 'active',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z'
      },
      {
        id: '2',
        name: 'Global Industries Ltd',
        code: 'GLOB002',
        tin: '987654321',
        address: '456 Corporate Blvd, Business District, BD 67890',
        contact: 'Sarah Johnson',
        email: 'info@globalindustries.com',
        phone: '+1 (555) 987-6543',
        status: 'active',
        createdAt: '2024-02-20T00:00:00.000Z',
        updatedAt: '2024-02-20T00:00:00.000Z'
      }
    ];

    const req = httpMock.expectOne(`${component['organizationService']['apiUrl']}`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockOrganizations });

    expect(component.organizations.length).toBe(2);
    expect(component.filteredOrganizations.length).toBe(2);
    expect(component.isLoading).toBe(false);
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Mock organization data for pagination tests
      component.organizations = [
        { id: '1', name: 'Org 1', code: 'ORG001', tin: '123', address: 'Address 1', contact: 'Contact 1', email: 'email1@test.com', phone: '123-456-7890', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Org 2', code: 'ORG002', tin: '456', address: 'Address 2', contact: 'Contact 2', email: 'email2@test.com', phone: '123-456-7891', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Org 3', code: 'ORG003', tin: '789', address: 'Address 3', contact: 'Contact 3', email: 'email3@test.com', phone: '123-456-7892', status: 'inactive', createdAt: new Date(), updatedAt: new Date() },
        { id: '4', name: 'Org 4', code: 'ORG004', tin: '012', address: 'Address 4', contact: 'Contact 4', email: 'email4@test.com', phone: '123-456-7893', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '5', name: 'Org 5', code: 'ORG005', tin: '345', address: 'Address 5', contact: 'Contact 5', email: 'email5@test.com', phone: '123-456-7894', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '6', name: 'Org 6', code: 'ORG006', tin: '678', address: 'Address 6', contact: 'Contact 6', email: 'email6@test.com', phone: '123-456-7895', status: 'inactive', createdAt: new Date(), updatedAt: new Date() }
      ];
      component.filteredOrganizations = [...component.organizations];
      component.updatePagination();
    });

    it('should initialize pagination correctly', () => {
      expect(component.totalItems).toBe(6);
      expect(component.totalPages).toBe(2); // 6 items / 5 per page = 2 pages
      expect(component.currentPage).toBe(1);
      expect(component.paginatedOrganizations.length).toBe(5); // First page should have 5 items
    });

    it('should navigate to next page', () => {
      component.goToNextPage();
      expect(component.currentPage).toBe(2);
      expect(component.paginatedOrganizations.length).toBe(1); // Second page should have 1 item
    });

    it('should navigate to previous page', () => {
      component.goToNextPage(); // Go to page 2
      component.goToPreviousPage(); // Go back to page 1
      expect(component.currentPage).toBe(1);
      expect(component.paginatedOrganizations.length).toBe(5);
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
      expect(component.paginatedOrganizations.length).toBe(6);
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
      component.searchTerm = 'Org 1';
      component.searchOrganizations();
      expect(component.currentPage).toBe(1); // Should reset to first page
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      component.organizations = [
        { id: '1', name: 'TechCorp', code: 'TECH', tin: '123456789', address: 'Address 1', contact: 'John Smith', email: 'john@techcorp.com', phone: '123-456-7890', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Global Industries', code: 'GLOB', tin: '987654321', address: 'Address 2', contact: 'Sarah Johnson', email: 'sarah@global.com', phone: '123-456-7891', status: 'active', createdAt: new Date(), updatedAt: new Date() }
      ];
      component.filteredOrganizations = [...component.organizations];
    });

    it('should filter by organization name', () => {
      component.searchTerm = 'TechCorp';
      component.searchOrganizations();
      expect(component.filteredOrganizations.length).toBe(1);
      expect(component.filteredOrganizations[0].name).toBe('TechCorp');
    });

    it('should filter by organization code', () => {
      component.searchTerm = 'GLOB';
      component.searchOrganizations();
      expect(component.filteredOrganizations.length).toBe(1);
      expect(component.filteredOrganizations[0].code).toBe('GLOB');
    });

    it('should filter by TIN', () => {
      component.searchTerm = '123456789';
      component.searchOrganizations();
      expect(component.filteredOrganizations.length).toBe(1);
      expect(component.filteredOrganizations[0].tin).toBe('123456789');
    });

    it('should filter by contact person', () => {
      component.searchTerm = 'John Smith';
      component.searchOrganizations();
      expect(component.filteredOrganizations.length).toBe(1);
      expect(component.filteredOrganizations[0].contact).toBe('John Smith');
    });

    it('should filter by email', () => {
      component.searchTerm = 'sarah@global.com';
      component.searchOrganizations();
      expect(component.filteredOrganizations.length).toBe(1);
      expect(component.filteredOrganizations[0].email).toBe('sarah@global.com');
    });

    it('should show all organizations when search term is empty', () => {
      component.searchTerm = '';
      component.searchOrganizations();
      expect(component.filteredOrganizations.length).toBe(2);
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      // Test with empty form
      expect(component['validateForm']()).toBe(false);

      // Test with valid form
      component.organizationForm = {
        name: 'Test Org',
        code: 'TEST',
        tin: '123456789',
        address: 'Test Address',
        contact: 'Test Contact',
        email: 'test@example.com',
        phone: '123-456-7890',
        status: 'active' as 'active' | 'inactive'
      };

      expect(component['validateForm']()).toBe(true);
    });

    it('should validate email format', () => {
      component.organizationForm = {
        name: 'Test Org',
        code: 'TEST',
        tin: '123456789',
        address: 'Test Address',
        contact: 'Test Contact',
        email: 'invalid-email',
        phone: '123-456-7890',
        status: 'active' as 'active' | 'inactive'
      };

      expect(component['validateForm']()).toBe(false);
    });
  });

  describe('Organization Operations', () => {
    it('should add organization', () => {
      const newOrg = {
        name: 'New Org',
        code: 'NEW',
        tin: '123456789',
        address: 'New Address',
        contact: 'New Contact',
        email: 'new@example.com',
        phone: '123-456-7890',
        status: 'active' as 'active' | 'inactive'
      };

      component.organizationForm = newOrg;
      component.isAddMode = true;

      const req = httpMock.expectOne(`${component['organizationService']['apiUrl']}`);
      expect(req.request.method).toBe('POST');
      req.flush({
        success: true,
        data: { id: '3', ...newOrg, createdAt: new Date(), updatedAt: new Date() },
        message: 'Organization created successfully'
      });

      expect(component.organizations.length).toBe(1);
    });

    it('should edit organization', () => {
      const org = {
        id: '1',
        name: 'Test Org',
        code: 'TEST',
        tin: '123456789',
        address: 'Test Address',
        contact: 'Test Contact',
        email: 'test@example.com',
        phone: '123-456-7890',
        status: 'active' as 'active' | 'inactive',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      component.editOrganization(org);
      expect(component.isEditMode).toBe(true);
      expect(component.selectedOrganization).toBe(org);
      expect(component.organizationForm.name).toBe('Test Org');
    });

    it('should delete organization', () => {
      const org = {
        id: '1',
        name: 'Test Org',
        code: 'TEST',
        tin: '123456789',
        address: 'Test Address',
        contact: 'Test Contact',
        email: 'test@example.com',
        phone: '123-456-7890',
        status: 'active' as 'active' | 'inactive',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      component.organizations = [org];
      component.filteredOrganizations = [org];

      spyOn(window, 'confirm').and.returnValue(true);

      const req = httpMock.expectOne(`${component['organizationService']['apiUrl']}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({
        success: true,
        message: 'Organization deleted successfully'
      });

      expect(component.organizations.length).toBe(0);
    });

    it('should toggle organization status', () => {
      const org = {
        id: '1',
        name: 'Test Org',
        code: 'TEST',
        tin: '123456789',
        address: 'Test Address',
        contact: 'Test Contact',
        email: 'test@example.com',
        phone: '123-456-7890',
        status: 'active' as 'active' | 'inactive',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      component.organizations = [org];
      component.filteredOrganizations = [org];

      const req = httpMock.expectOne(`${component['organizationService']['apiUrl']}/1/toggle-status`);
      expect(req.request.method).toBe('PATCH');
      req.flush({
        success: true,
        data: { ...org, status: 'inactive' },
        message: 'Organization status updated successfully'
      });

      expect(component.organizations[0].status).toBe('inactive');
    });
  });
});
