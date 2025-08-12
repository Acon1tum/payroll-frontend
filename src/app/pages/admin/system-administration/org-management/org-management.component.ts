import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { OrganizationService, Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '../../../../services/organization.service';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-org-management',
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
  statusFilter = 'all';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isSidebarCollapsed = false;
  nameValidationMessage: { message: string; isError: boolean } | null = null;
  codeValidationMessage: { message: string; isError: boolean } | null = null;
  tinValidationMessage: { message: string; isError: boolean } | null = null;
  searchTimeout: any = null;

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
  }

  loadOrganizations() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.organizationService.getOrganizations().subscribe({
      next: (response) => {
        this.organizations = response.data;
        this.filteredOrganizations = [...this.organizations];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.errorMessage = 'Failed to load organizations';
        this.isLoading = false;
      }
    });
  }

  searchOrganizations() {
    const searchTerm = this.searchTerm.trim().toLowerCase();
    
    let filtered = [...this.organizations];

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === this.statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(org => {
        // Search in name (case-insensitive)
        const nameMatch = org.name?.toLowerCase().includes(searchTerm);
        
        // Search in code (case-insensitive)
        const codeMatch = org.code?.toLowerCase().includes(searchTerm);
        
        // Search in TIN (case-insensitive)
        const tinMatch = org.tin?.toLowerCase().includes(searchTerm);
        
        // Search in contact person (case-insensitive)
        const contactMatch = org.contact?.toLowerCase().includes(searchTerm);
        
        // Search in email (case-insensitive)
        const emailMatch = org.email?.toLowerCase().includes(searchTerm);
        
        // Search in phone (case-insensitive, if exists)
        const phoneMatch = org.phone?.toLowerCase().includes(searchTerm);
        
        // Search in address (case-insensitive, if exists)
        const addressMatch = org.address?.toLowerCase().includes(searchTerm);
        
        // Return true if any field matches
        return nameMatch || codeMatch || tinMatch || contactMatch || emailMatch || phoneMatch || addressMatch;
      });
    }

    this.filteredOrganizations = filtered;
  }

  addOrganization() {
    this.isAddMode = true;
    this.isEditMode = false;
    this.selectedOrganization = null;
    this.resetForm();
    this.clearValidationMessages();
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
      phone: organization.phone || '',
      status: organization.status
    };
    this.clearValidationMessages();
  }

  saveOrganization() {
    if (this.isAddMode) {
      const createRequest: CreateOrganizationRequest = {
        name: this.organizationForm.name,
        code: this.organizationForm.code,
        tin: this.organizationForm.tin,
        address: this.organizationForm.address,
        contact: this.organizationForm.contact,
        email: this.organizationForm.email,
        phone: this.organizationForm.phone || undefined,
        status: this.organizationForm.status
      };

      // Check for duplicates before creating
      this.checkDuplicateBeforeSave(createRequest.name, createRequest.tin, () => {
        this.organizationService.createOrganization(createRequest).subscribe({
          next: (response) => {
            this.successMessage = response.message;
            this.loadOrganizations();
            this.cancelEdit();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            console.error('Error creating organization:', error);
            if (error.status === 409) {
              this.errorMessage = error.error.message || 'An organization with this name or TIN already exists';
            } else {
              this.errorMessage = 'Failed to create organization';
            }
            setTimeout(() => this.errorMessage = '', 5000);
          }
        });
      });
    } else if (this.isEditMode && this.selectedOrganization) {
      const updateRequest: UpdateOrganizationRequest = {
        name: this.organizationForm.name,
        code: this.organizationForm.code,
        tin: this.organizationForm.tin,
        address: this.organizationForm.address,
        contact: this.organizationForm.contact,
        email: this.organizationForm.email,
        phone: this.organizationForm.phone || undefined,
        status: this.organizationForm.status
      };

      // Check for duplicates before updating
      this.checkDuplicateBeforeSave(updateRequest.name!, updateRequest.tin!, () => {
        this.organizationService.updateOrganization(this.selectedOrganization!.id, updateRequest).subscribe({
          next: (response) => {
            this.successMessage = response.message;
            this.loadOrganizations();
            this.cancelEdit();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error) => {
            console.error('Error updating organization:', error);
            if (error.status === 409) {
              this.errorMessage = error.error.message || 'An organization with this name or TIN already exists';
            } else {
              this.errorMessage = 'Failed to update organization';
            }
            setTimeout(() => this.errorMessage = '', 5000);
          }
        });
      }, this.selectedOrganization.id);
    }
  }

  // Check for duplicate organization name or TIN before saving
  private checkDuplicateBeforeSave(name: string, tin: string, onSuccess: () => void, excludeId?: string) {
    if (!name.trim() || !tin.trim()) {
      this.errorMessage = 'Please fill in all required fields';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.organizationService.checkDuplicateOrganization(name.trim(), tin.trim(), excludeId).subscribe({
      next: (response) => {
        if (response.isDuplicate) {
          const duplicateMessages = response.duplicates.map(d => d.message).join(', ');
          this.errorMessage = duplicateMessages;
          setTimeout(() => this.errorMessage = '', 5000);
        } else {
          // No duplicates found, proceed with save
          onSuccess();
        }
      },
      error: (error) => {
        console.error('Error checking duplicate:', error);
        // If duplicate check fails, still try to save (backend will catch duplicates)
        onSuccess();
      }
    });
  }

  deleteOrganization(organization: Organization) {
    if (confirm(`Are you sure you want to delete ${organization.name}?`)) {
      this.organizationService.deleteOrganization(organization.id).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadOrganizations();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting organization:', error);
          if (error.status === 400) {
            this.errorMessage = error.error.message || 'Cannot delete organization with existing departments or employees';
          } else {
            this.errorMessage = 'Failed to delete organization';
          }
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  cancelEdit() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.selectedOrganization = null;
    this.resetForm();
    this.clearValidationMessages();
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

  toggleStatus(organization: Organization) {
    this.organizationService.toggleOrganizationStatus(organization.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadOrganizations();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error toggling organization status:', error);
        this.errorMessage = 'Failed to update organization status';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.clearValidationMessages();
  }

  clearValidationMessages() {
    this.nameValidationMessage = null;
    this.codeValidationMessage = null;
    this.tinValidationMessage = null;
  }

  // Validate organization name for duplicates
  validateOrganizationName() {
    const name = this.organizationForm.name?.trim();
    
    if (!name) {
      this.nameValidationMessage = null;
      return;
    }

    this.organizationService.checkDuplicateOrganization(name, undefined, this.selectedOrganization?.id).subscribe({
      next: (response) => {
        const nameDuplicate = response.duplicates.find(d => d.field === 'name');
        if (nameDuplicate) {
          this.nameValidationMessage = {
            message: nameDuplicate.message,
            isError: true
          };
        } else {
          this.nameValidationMessage = {
            message: 'Organization name is available',
            isError: false
          };
        }
      },
      error: (error) => {
        console.error('Error validating organization name:', error);
      }
    });
  }

  // Validate organization TIN for duplicates
  validateOrganizationTIN() {
    const tin = this.organizationForm.tin?.trim();
    
    if (!tin) {
      this.tinValidationMessage = null;
      return;
    }

    this.organizationService.checkDuplicateOrganization(undefined, tin, this.selectedOrganization?.id).subscribe({
      next: (response) => {
        const tinDuplicate = response.duplicates.find(d => d.field === 'tin');
        if (tinDuplicate) {
          this.tinValidationMessage = {
            message: tinDuplicate.message,
            isError: true
          };
        } else {
          this.tinValidationMessage = {
            message: 'TIN is available',
            isError: false
          };
        }
      },
      error: (error) => {
        console.error('Error validating organization TIN:', error);
      }
    });
  }

  // Validate organization code for duplicates
  validateOrganizationCode() {
    const code = this.organizationForm.code?.trim();
    
    if (!code) {
      this.codeValidationMessage = null;
      return;
    }

    this.organizationService.checkDuplicateOrganization(undefined, undefined, this.selectedOrganization?.id, code).subscribe({
      next: (response) => {
        const codeDuplicate = response.duplicates.find(d => d.field === 'code');
        if (codeDuplicate) {
          this.codeValidationMessage = {
            message: codeDuplicate.message,
            isError: true
          };
        } else {
          this.codeValidationMessage = {
            message: 'Organization code is available',
            isError: false
          };
        }
      },
      error: (error) => {
        console.error('Error validating organization code:', error);
      }
    });
  }

  // Close modal when clicking outside
  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.cancelEdit();
    }
  }

  // Clear search
  clearSearch() {
    this.searchTerm = '';
    this.searchOrganizations();
  }

  // Handle status filter change
  onStatusFilterChange() {
    this.searchOrganizations();
  }

  // Clear all filters
  clearAllFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.searchOrganizations();
  }

  // Handle search input with debouncing
  onSearchInput() {
    // Clear any existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set a new timeout to search after user stops typing
    this.searchTimeout = setTimeout(() => {
      this.searchOrganizations();
    }, 300);
  }
}
