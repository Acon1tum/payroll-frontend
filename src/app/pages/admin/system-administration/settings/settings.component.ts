import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/header/header.component';
import { SidebarComponent } from '../../../../shared/sidebar/sidebar.component';
import { SettingsService, SystemSetting, CreateSettingRequest, UpdateSettingRequest } from '../../../../services/settings.service';
import { TimezoneService } from '../../../../services/timezone.service';
import { Subscription } from 'rxjs';

interface Breadcrumb {
  label: string;
  path?: string;
  active?: boolean;
}

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
  settings: SystemSetting[] = [];
  filteredSettings: SystemSetting[] = [];
  categories: string[] = [];
  selectedSetting: SystemSetting | null = null;
  isAddMode = false;
  isEditMode = false;
  isViewMode = false;
  searchTerm = '';
  selectedCategory = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Timezone properties
  selectedTimezone = '';
  availableTimezones: string[] = [];
  isTimezoneLoading = false;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  itemsPerPageOptions = [5, 10, 15, 20, 50];
  totalItems = 0;
  totalPages = 0;
  paginatedSettings: SystemSetting[] = [];
  Math = Math; // Make Math available in template

  // Form validation
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  // Breadcrumbs for header
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'System Administration', path: '/admin/system-administration' },
    { label: 'Settings', active: true }
  ];

  // Form data
  settingForm = {
    key: '',
    value: '',
    description: '',
    category: '',
    isEditable: true,
    dataType: 'string' as 'string' | 'number' | 'boolean' | 'json'
  };

  // Data type options
  dataTypeOptions = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'json', label: 'JSON' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private settingsService: SettingsService,
    private timezoneService: TimezoneService
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadTimezoneData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load settings
    this.subscriptions.add(
      this.settingsService.getAllSettings().subscribe({
        next: (response) => {
          this.settings = response.data;
          this.filteredSettings = [...this.settings];
          this.updatePagination();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading settings:', error);
          this.errorMessage = 'Failed to load settings. Please try again.';
          this.isLoading = false;
        }
      })
    );

    // Load categories
    this.subscriptions.add(
      this.settingsService.getSettingCategories().subscribe({
        next: (response) => {
          this.categories = response.data;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          // Use default categories if API fails
          this.categories = this.settingsService.getCommonCategories();
        }
      })
    );
  }

  loadTimezoneData() {
    this.availableTimezones = this.settingsService.getAvailableTimezones();
    
    // Load current system timezone
    this.subscriptions.add(
      this.settingsService.getSystemTimezone().subscribe({
        next: (timezone) => {
          this.selectedTimezone = timezone;
        },
        error: (error) => {
          console.error('Error loading timezone setting:', error);
          this.selectedTimezone = 'Asia/Manila'; // Default fallback
        }
      })
    );
  }

  // Timezone change handler
  onTimezoneChange() {
    if (this.selectedTimezone) {
      this.isTimezoneLoading = true;
      this.subscriptions.add(
        this.settingsService.updateSystemTimezone(this.selectedTimezone).subscribe({
          next: (response) => {
            // Update the timezone service to reflect the change system-wide
            this.timezoneService.updateSystemTimezone(this.selectedTimezone);
            
            // ✅ Broadcast timezone change to all components
            this.settingsService.updateTimezone(this.selectedTimezone);
            console.log('System timezone updated to:', this.selectedTimezone);
            
            this.showSuccessMessage(`System timezone updated to ${this.settingsService.getTimezoneDisplayName(this.selectedTimezone)}`);
            this.isTimezoneLoading = false;
          },
          error: (error) => {
            console.error('Error updating timezone:', error);
            this.showErrorMessage('Failed to update system timezone. Please try again.');
            this.isTimezoneLoading = false;
          }
        })
      );
    }
  }

  // Get timezone display name
  getTimezoneDisplayName(timezone: string): string {
    return this.settingsService.getTimezoneDisplayName(timezone);
  }

  // Search and filtering
  onSearch() {
    this.filterSettings();
    this.currentPage = 1;
    this.updatePagination();
  }

  filterSettings() {
    let filtered = [...this.settings];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(setting =>
        setting.key.toLowerCase().includes(searchLower) ||
        setting.description.toLowerCase().includes(searchLower) ||
        setting.value.toLowerCase().includes(searchLower) ||
        setting.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(setting => setting.category === this.selectedCategory);
    }

    this.filteredSettings = filtered;
    this.totalItems = filtered.length;
  }

  // Pagination
  updatePagination() {
    this.totalItems = this.filteredSettings.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSettings = this.filteredSettings.slice(startIndex, endIndex);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  // CRUD Operations
  addSetting() {
    this.isAddMode = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedSetting = null;
    this.resetForm();
    this.clearFormErrors();
  }

  editSetting(setting: SystemSetting) {
    this.selectedSetting = setting;
    this.isEditMode = true;
    this.isAddMode = false;
    this.isViewMode = false;
    this.populateForm(setting);
    this.clearFormErrors();
  }

  viewSetting(setting: SystemSetting) {
    this.selectedSetting = setting;
    this.isViewMode = true;
    this.isAddMode = false;
    this.isEditMode = false;
    this.populateForm(setting);
  }

  deleteSetting(setting: SystemSetting) {
    if (confirm(`Are you sure you want to delete the setting "${setting.key}"? This action cannot be undone.`)) {
      this.isSubmitting = true;
      this.subscriptions.add(
        this.settingsService.deleteSetting(setting.id).subscribe({
          next: (response) => {
            this.showSuccessMessage(response.message);
            this.loadData();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error deleting setting:', error);
            this.showErrorMessage('Failed to delete setting. Please try again.');
          },
          complete: () => {
            this.isSubmitting = false;
          }
        })
      );
    }
  }

  saveSetting() {
    if (this.validateForm()) {
      this.isSubmitting = true;
      
      if (this.isAddMode) {
        this.createSetting();
      } else if (this.isEditMode) {
        this.updateSetting();
      }
    }
  }

  private createSetting() {
    const newSetting: CreateSettingRequest = {
      key: this.settingForm.key,
      value: this.settingForm.value,
      description: this.settingForm.description,
      category: this.settingForm.category,
      isEditable: this.settingForm.isEditable,
      dataType: this.settingForm.dataType
    };

    this.subscriptions.add(
      this.settingsService.createSetting(newSetting).subscribe({
        next: (response) => {
          // ✅ Broadcast timezone change if it's a timezone setting
          if (newSetting.key === 'system.timezone') {
            this.settingsService.updateTimezone(newSetting.value);
            console.log('System timezone created with:', newSetting.value);
          }
          
          this.showSuccessMessage(response.message);
          this.loadData();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating setting:', error);
          this.showErrorMessage('Failed to create setting. Please try again.');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      })
    );
  }

  private updateSetting() {
    if (!this.selectedSetting) return;

    const updateData: UpdateSettingRequest = {
      value: this.settingForm.value,
      description: this.settingForm.description,
      category: this.settingForm.category,
      isEditable: this.settingForm.isEditable,
      dataType: this.settingForm.dataType
      };

    this.subscriptions.add(
      this.settingsService.updateSetting(this.selectedSetting.id, updateData).subscribe({
        next: (response) => {
          // ✅ Broadcast timezone change if it's a timezone setting
          if (this.selectedSetting?.key === 'system.timezone') {
            this.settingsService.updateTimezone(updateData.value || '');
            console.log('System timezone updated to:', updateData.value);
          }
          
          this.showSuccessMessage(response.message);
          this.loadData();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating setting:', error);
          this.showErrorMessage('Failed to update setting. Please try again.');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      })
    );
  }

  // Form validation
  private validateForm(): boolean {
    this.clearFormErrors();
    let isValid = true;

    if (!this.settingForm.key.trim()) {
      this.formErrors['key'] = 'Setting key is required';
      isValid = false;
    } else if (this.settingForm.key.includes(' ')) {
      this.formErrors['key'] = 'Setting key cannot contain spaces';
      isValid = false;
    }

    if (!this.settingForm.value.trim()) {
      this.formErrors['value'] = 'Value is required';
      isValid = false;
    }

    if (!this.settingForm.description.trim()) {
      this.formErrors['description'] = 'Description is required';
      isValid = false;
    }

    if (!this.settingForm.category) {
      this.formErrors['category'] = 'Category is required';
      isValid = false;
    }

    if (!this.settingForm.dataType) {
      this.formErrors['dataType'] = 'Data type is required';
      isValid = false;
    }

    // Validate value based on data type
    if (this.settingForm.value && this.settingForm.dataType) {
      if (!this.settingsService.validateSettingValue(this.settingForm.value, this.settingForm.dataType)) {
        this.formErrors['value'] = `Invalid ${this.settingForm.dataType} value`;
        isValid = false;
      }
    }

    return isValid;
  }

  private clearFormErrors() {
    this.formErrors = {};
  }

  // Form helpers
  private populateForm(setting: SystemSetting) {
    this.settingForm = {
      key: setting.key,
      value: setting.value,
      description: setting.description,
      category: setting.category,
      isEditable: setting.isEditable,
      dataType: setting.dataType
    };
  }

  private resetForm() {
    this.settingForm = {
      key: '',
      value: '',
      description: '',
      category: '',
      isEditable: true,
      dataType: 'string'
    };
  }

  closeModal() {
    this.isAddMode = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedSetting = null;
    this.resetForm();
    this.clearFormErrors();
    this.isSubmitting = false;
  }

  // Utility methods
  formatValue(setting: SystemSetting): string {
    return this.settingsService.formatSettingValue(setting);
  }

  getDataTypeLabel(dataType: string): string {
    const option = this.dataTypeOptions.find(opt => opt.value === dataType);
    return option ? option.label : dataType;
  }

  // Message helpers
  private showSuccessMessage(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showErrorMessage(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  // Export settings
  exportSettings() {
    this.isSubmitting = true;
    this.subscriptions.add(
      this.settingsService.exportSettings().subscribe({
        next: (response) => {
          const dataStr = JSON.stringify(response, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = window.URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          window.URL.revokeObjectURL(url);
          
          this.showSuccessMessage('Settings exported successfully');
        },
        error: (error) => {
          console.error('Error exporting settings:', error);
          this.showErrorMessage('Failed to export settings. Please try again.');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      })
    );
  }

  // Reset settings to defaults
  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone and will affect all system configurations.')) {
      this.isSubmitting = true;
      this.subscriptions.add(
        this.settingsService.resetSettingsToDefaults().subscribe({
          next: (response) => {
            this.showSuccessMessage(response.message);
            this.loadData();
          },
          error: (error) => {
            console.error('Error resetting settings:', error);
            this.showErrorMessage('Failed to reset settings. Please try again.');
          },
          complete: () => {
            this.isSubmitting = false;
          }
        })
      );
    }
  }

  // Clear filters
  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.filterSettings();
    this.currentPage = 1;
    this.updatePagination();
  }

  // Get form error for a specific field
  getFieldError(field: string): string {
    return this.formErrors[field] || '';
  }

  // Check if form has errors
  hasFormErrors(): boolean {
    return Object.keys(this.formErrors).length > 0;
  }
}
