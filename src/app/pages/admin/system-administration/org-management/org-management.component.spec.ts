import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgManagementComponent } from './org-management.component';

describe('OrgManagementComponent', () => {
  let component: OrgManagementComponent;
  let fixture: ComponentFixture<OrgManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Mock organization data for pagination tests
      component.organizations = [
        { id: 1, name: 'Org 1', tin: '123', address: 'Address 1', contact: 'Contact 1', email: 'email1@test.com', phone: '123-456-7890', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Org 2', tin: '456', address: 'Address 2', contact: 'Contact 2', email: 'email2@test.com', phone: '123-456-7891', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: 'Org 3', tin: '789', address: 'Address 3', contact: 'Contact 3', email: 'email3@test.com', phone: '123-456-7892', status: 'inactive', createdAt: new Date(), updatedAt: new Date() },
        { id: 4, name: 'Org 4', tin: '012', address: 'Address 4', contact: 'Contact 4', email: 'email4@test.com', phone: '123-456-7893', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: 5, name: 'Org 5', tin: '345', address: 'Address 5', contact: 'Contact 5', email: 'email5@test.com', phone: '123-456-7894', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: 6, name: 'Org 6', tin: '678', address: 'Address 6', contact: 'Contact 6', email: 'email6@test.com', phone: '123-456-7895', status: 'inactive', createdAt: new Date(), updatedAt: new Date() }
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
});
