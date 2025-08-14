import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { OrganizationService, OrganizationDto, CreateOrganizationDto, UpdateOrganizationDto } from '../../../../services/organization.service';

interface Organization {
  id: string;
  name: string;
  code: string;
  tin: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-org-management',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './org-management.component.html',
  styleUrl: './org-management.component.scss'
})
export class OrgManagementComponent implements OnInit {
  organizations: Organization[] = [];
  filteredOrganizations: Organization[] = [];
  selectedOrganization: Organization | null = null;
  isAddMode = false;
  isEditMode = false;
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 5;
  itemsPerPageOptions = [5, 10, 15, 20];
  totalItems = 0;
  totalPages = 0;
  paginatedOrganizations: Organization[] = [];
  Math = Math;

  // Debouncing for search
  private searchTimeout: any;

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'System Administration', path: '/admin/system-administration' },
    { label: 'Organization Management', active: true }
  ];

  // Form data
  organizationForm = {
    name: '',
    code: '',
    tin: '',
    address: '',
    contact: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  };

  constructor(private organizationService: OrganizationService) {}

  ngOnInit() {
    this.loadOrganizations();
    this.setupModalListeners();
  }

  ngOnDestroy() {
    this.removeModalListeners();
    // Clear search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  private setupModalListeners() {
    // Add escape key listener
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  private removeModalListeners() {
    // Remove escape key listener
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  private handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && (this.isAddMode || this.isEditMode)) {
      this.cancelEdit();
    }
  }

  // Method to handle modal backdrop click
  onModalBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.cancelEdit();
    }
  }

  loadOrganizations() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.organizationService.getOrganizations().subscribe({
      next: (response) => {
        const apiOrganizations: OrganizationDto[] = response.data || [];
        this.organizations = apiOrganizations.map((org) => ({
          id: org.id,
          name: org.name,
          code: org.code,
          tin: org.tin,
          address: org.address,
          contact: org.contact,
          email: org.email,
          phone: org.phone || '',
          status: org.status as 'active' | 'inactive',
          createdAt: new Date(org.createdAt),
          updatedAt: new Date(org.updatedAt),
        }));
        this.filteredOrganizations = [...this.organizations];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load organizations', error);
        this.errorMessage = 'Failed to load organizations. Please try again.';
        this.isLoading = false;
      }
    });
  }

  searchOrganizations() {
    if (!this.searchTerm.trim()) {
      this.filteredOrganizations = [...this.organizations];
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredOrganizations = this.organizations.filter(org =>
        org.name.toLowerCase().includes(searchLower) ||
        org.code.toLowerCase().includes(searchLower) ||
        org.tin.toLowerCase().includes(searchLower) ||
        org.contact.toLowerCase().includes(searchLower) ||
        org.email.toLowerCase().includes(searchLower) ||
        org.address.toLowerCase().includes(searchLower) ||
        (org.phone && org.phone.toLowerCase().includes(searchLower))
      );
    }
    this.currentPage = 1; // Reset to first page when searching
    this.updatePagination();
  }

  // Enhanced search with debouncing
  onSearchInput() {
    // Clear any existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set a new timeout to search after user stops typing
    this.searchTimeout = setTimeout(() => {
      this.searchOrganizations();
    }, 300); // 300ms delay
  }

  // Clear search
  clearSearch() {
    this.searchTerm = '';
    this.searchOrganizations();
  }

  // Check if search has results
  get hasSearchResults(): boolean {
    return this.filteredOrganizations.length > 0;
  }

  // Get search result count
  get searchResultCount(): number {
    return this.filteredOrganizations.length;
  }

  // Highlight search terms in text
  highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm || !text) {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  // Check if text contains search term
  containsSearchTerm(text: string, searchTerm: string): boolean {
    if (!searchTerm || !text) {
      return false;
    }
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  }

  // Pagination methods
  updatePagination() {
    this.totalItems = this.filteredOrganizations.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Ensure current page is within valid range
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedOrganizations = this.filteredOrganizations.slice(startIndex, endIndex);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  goToFirstPage() {
    this.goToPage(1);
  }

  goToLastPage() {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage() {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage() {
    this.goToPage(this.currentPage + 1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if total is less than or equal to max visible
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages around the current page
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      // Adjust if we're near the end
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  addOrganization() {
    this.isAddMode = true;
    this.isEditMode = false;
    this.selectedOrganization = null;
    this.resetForm();
  }

  editOrganization(organization: Organization) {
    this.isEditMode = true;
    this.isAddMode = false;
    this.selectedOrganization = organization;
    this.organizationForm = {
      name: organization.name,
      code: organization.code,
      tin: organization.tin,
      address: organization.address,
      contact: organization.contact,
      email: organization.email,
      phone: organization.phone,
      status: organization.status
    };
  }

  saveOrganization() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isAddMode) {
      const createData: CreateOrganizationDto = {
        name: this.organizationForm.name.trim(),
        code: this.organizationForm.code.trim(),
        tin: this.organizationForm.tin.trim(),
        address: this.organizationForm.address.trim(),
        contact: this.organizationForm.contact.trim(),
        email: this.organizationForm.email.trim().toLowerCase(),
        phone: this.organizationForm.phone.trim() || undefined,
        status: this.organizationForm.status
      };

      this.organizationService.createOrganization(createData).subscribe({
        next: (response) => {
          const newOrg: Organization = {
            id: response.data.id,
            name: response.data.name,
            code: response.data.code,
            tin: response.data.tin,
            address: response.data.address,
            contact: response.data.contact,
            email: response.data.email,
            phone: response.data.phone || '',
            status: response.data.status as 'active' | 'inactive',
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt),
          };
          this.organizations.push(newOrg);
          this.filteredOrganizations = [...this.organizations];
          this.updatePagination();
          this.showSuccessMessage(response.message || 'Organization created successfully!');
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error creating organization:', error);
          this.showErrorMessage(this.getErrorMessage(error));
        }
      });
    } else if (this.isEditMode && this.selectedOrganization) {
      const updateData: UpdateOrganizationDto = {
        name: this.organizationForm.name.trim(),
        code: this.organizationForm.code.trim(),
        tin: this.organizationForm.tin.trim(),
        address: this.organizationForm.address.trim(),
        contact: this.organizationForm.contact.trim(),
        email: this.organizationForm.email.trim().toLowerCase(),
        phone: this.organizationForm.phone.trim() || undefined,
        status: this.organizationForm.status
      };

      this.organizationService.updateOrganization(this.selectedOrganization.id, updateData).subscribe({
        next: (response) => {
          const index = this.organizations.findIndex(org => org.id === this.selectedOrganization!.id);
          if (index !== -1) {
            this.organizations[index] = {
              ...this.organizations[index],
              name: response.data.name,
              code: response.data.code,
              tin: response.data.tin,
              address: response.data.address,
              contact: response.data.contact,
              email: response.data.email,
              phone: response.data.phone || '',
              status: response.data.status as 'active' | 'inactive',
              updatedAt: new Date(response.data.updatedAt)
            };
            this.filteredOrganizations = [...this.organizations];
            this.updatePagination();
          }
          this.showSuccessMessage(response.message || 'Organization updated successfully!');
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating organization:', error);
          this.showErrorMessage(this.getErrorMessage(error));
        }
      });
    }
  }

  deleteOrganization(organization: Organization) {
    if (confirm(`Are you sure you want to delete ${organization.name}? This action cannot be undone.`)) {
      this.isLoading = true;
      this.errorMessage = '';

      this.organizationService.deleteOrganization(organization.id).subscribe({
        next: (response) => {
          this.organizations = this.organizations.filter(org => org.id !== organization.id);
          this.filteredOrganizations = [...this.organizations];
          this.updatePagination();
          this.showSuccessMessage(response.message || 'Organization deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting organization:', error);
          this.showErrorMessage(this.getErrorMessage(error));
        }
      });
    }
  }

  toggleStatus(organization: Organization) {
    this.isLoading = true;
    this.errorMessage = '';

    this.organizationService.toggleOrganizationStatus(organization.id).subscribe({
      next: (response) => {
        const index = this.organizations.findIndex(org => org.id === organization.id);
        if (index !== -1) {
          this.organizations[index] = {
            ...this.organizations[index],
            status: response.data.status as 'active' | 'inactive',
            updatedAt: new Date(response.data.updatedAt)
          };
          this.filteredOrganizations = [...this.organizations];
          this.updatePagination();
        }
        this.showSuccessMessage(response.message || 'Organization status updated successfully!');
      },
      error: (error) => {
        console.error('Error toggling organization status:', error);
        this.showErrorMessage(this.getErrorMessage(error));
      }
    });
  }

  cancelEdit() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.selectedOrganization = null;
    this.resetForm();
    this.errorMessage = '';
  }

  resetForm() {
    this.organizationForm = {
      name: '',
      code: '',
      tin: '',
      address: '',
      contact: '',
      email: '',
      phone: '',
      status: 'active'
    };
  }

  private validateForm(): boolean {
    if (!this.organizationForm.name.trim()) {
      this.showErrorMessage('Organization name is required.');
      return false;
    }
    if (!this.organizationForm.code.trim()) {
      this.showErrorMessage('Organization code is required.');
      return false;
    }
    if (!this.organizationForm.tin.trim()) {
      this.showErrorMessage('TIN is required.');
      return false;
    }
    if (!this.organizationForm.address.trim()) {
      this.showErrorMessage('Address is required.');
      return false;
    }
    if (!this.organizationForm.contact.trim()) {
      this.showErrorMessage('Contact person is required.');
      return false;
    }
    if (!this.organizationForm.email.trim()) {
      this.showErrorMessage('Email is required.');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.organizationForm.email)) {
      this.showErrorMessage('Please enter a valid email address.');
      return false;
    }

    return true;
  }

  private getErrorMessage(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    } else if (error.status === 400) {
      return 'Invalid data provided. Please check your input.';
    } else if (error.status === 409) {
      return 'An organization with this information already exists.';
    } else if (error.status === 404) {
      return 'Organization not found.';
    } else {
      return 'An error occurred. Please try again.';
    }
  }

  private showSuccessMessage(message: string) {
    this.successMessage = message;
    this.isLoading = false;
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    this.isLoading = false;
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
}
