import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';

interface Organization {
  id: number;
  name: string;
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

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'System Administration', path: '/admin/system-administration' },
    { label: 'Organization Management', active: true }
  ];

  // Form data
  organizationForm = {
    name: '',
    tin: '',
    address: '',
    contact: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  };

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      this.organizations = [
        {
          id: 1,
          name: 'TechCorp Solutions',
          tin: '123456789',
          address: '123 Business Ave, Tech City, TC 12345',
          contact: 'John Smith',
          email: 'contact@techcorp.com',
          phone: '+1 (555) 123-4567',
          status: 'active',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: 2,
          name: 'Global Industries Ltd',
          tin: '987654321',
          address: '456 Corporate Blvd, Business District, BD 67890',
          contact: 'Sarah Johnson',
          email: 'info@globalindustries.com',
          phone: '+1 (555) 987-6543',
          status: 'active',
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-02-20')
        },
        {
          id: 3,
          name: 'Startup Ventures Inc',
          tin: '456789123',
          address: '789 Innovation St, Startup Valley, SV 11111',
          contact: 'Mike Chen',
          email: 'hello@startupventures.com',
          phone: '+1 (555) 456-7890',
          status: 'inactive',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-10')
        }
      ];
      this.filteredOrganizations = [...this.organizations];
      this.isLoading = false;
    }, 1000);
  }

  searchOrganizations() {
    if (!this.searchTerm.trim()) {
      this.filteredOrganizations = [...this.organizations];
    } else {
      this.filteredOrganizations = this.organizations.filter(org =>
        org.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        org.tin.includes(this.searchTerm) ||
        org.contact.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
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
      tin: organization.tin,
      address: organization.address,
      contact: organization.contact,
      email: organization.email,
      phone: organization.phone,
      status: organization.status
    };
  }

  saveOrganization() {
    if (this.isAddMode) {
      const newOrg: Organization = {
        id: this.organizations.length + 1,
        ...this.organizationForm,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.organizations.push(newOrg);
      this.filteredOrganizations = [...this.organizations];
    } else if (this.isEditMode && this.selectedOrganization) {
      const index = this.organizations.findIndex(org => org.id === this.selectedOrganization!.id);
      if (index !== -1) {
        this.organizations[index] = {
          ...this.selectedOrganization,
          ...this.organizationForm,
          updatedAt: new Date()
        };
        this.filteredOrganizations = [...this.organizations];
      }
    }
    this.cancelEdit();
  }

  deleteOrganization(organization: Organization) {
    if (confirm(`Are you sure you want to delete ${organization.name}?`)) {
      this.organizations = this.organizations.filter(org => org.id !== organization.id);
      this.filteredOrganizations = [...this.organizations];
    }
  }

  cancelEdit() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.selectedOrganization = null;
    this.resetForm();
  }

  resetForm() {
    this.organizationForm = {
      name: '',
      tin: '',
      address: '',
      contact: '',
      email: '',
      phone: '',
      status: 'active'
    };
  }

  toggleStatus(organization: Organization) {
    organization.status = organization.status === 'active' ? 'inactive' : 'active';
    organization.updatedAt = new Date();
  }
}
