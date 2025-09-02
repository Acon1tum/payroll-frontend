import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../../../services/settings.service';
import { SidebarService } from '../../../../shared/sidebar/sidebar.service';
import { of } from 'rxjs';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let sidebarService: jasmine.SpyObj<SidebarService>;

  const mockSettings = [
    {
      id: '1',
      key: 'system.name',
      value: 'Payroll System',
      description: 'System display name',
      category: 'General',
      isEditable: true,
      dataType: 'string' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      key: 'system.debug',
      value: 'false',
      description: 'Enable debug mode',
      category: 'General',
      isEditable: true,
      dataType: 'boolean' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockCategories = ['General', 'Security', 'Email'];

  beforeEach(async () => {
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', [
      'getAllSettings',
      'getSettingCategories',
      'createSetting',
      'updateSetting',
      'deleteSetting',
      'resetSettingsToDefaults',
      'exportSettings',
      'validateSettingValue',
      'formatSettingValue',
      'getDataTypeOptions',
      'getCommonCategories'
    ]);

    const sidebarServiceSpy = jasmine.createSpyObj('SidebarService', [], {
      isCollapsed$: of(false)
    });

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: SidebarService, useValue: sidebarServiceSpy }
      ]
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    sidebarService = TestBed.inject(SidebarService) as jasmine.SpyObj<SidebarService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings and categories on init', () => {
    settingsService.getAllSettings.and.returnValue(of({
      success: true,
      message: 'Settings retrieved successfully',
      data: mockSettings
    }));

    settingsService.getSettingCategories.and.returnValue(of({
      success: true,
      message: 'Categories retrieved successfully',
      data: mockCategories
    }));

    fixture.detectChanges();

    expect(settingsService.getAllSettings).toHaveBeenCalled();
    expect(settingsService.getSettingCategories).toHaveBeenCalled();
    expect(component.settings).toEqual(mockSettings);
    expect(component.categories).toEqual(mockCategories);
  });

  it('should filter settings by search term', () => {
    component.settings = mockSettings;
    component.searchTerm = 'debug';
    
    component.filterSettings();
    
    expect(component.filteredSettings.length).toBe(1);
    expect(component.filteredSettings[0].key).toBe('system.debug');
  });

  it('should filter settings by category', () => {
    component.settings = mockSettings;
    component.selectedCategory = 'General';
    
    component.filterSettings();
    
    expect(component.filteredSettings.length).toBe(2);
    expect(component.filteredSettings.every(s => s.category === 'General')).toBe(true);
  });

  it('should clear filters', () => {
    component.searchTerm = 'test';
    component.selectedCategory = 'Security';
    component.currentPage = 3;
    
    component.clearFilters();
    
    expect(component.searchTerm).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.currentPage).toBe(1);
  });

  it('should add new setting', () => {
    const newSetting = {
      key: 'test.key',
      value: 'test value',
      description: 'Test description',
      category: 'Test',
      isEditable: true,
      dataType: 'string' as const
    };

    settingsService.createSetting.and.returnValue(of({
      success: true,
      message: 'Setting created successfully',
      data: { ...newSetting, id: '3', createdAt: new Date(), updatedAt: new Date() }
    }));

    component.settingForm = newSetting;
    component.isAddMode = true;
    
    component.saveSetting();
    
    expect(settingsService.createSetting).toHaveBeenCalledWith(newSetting);
  });

  it('should update existing setting', () => {
    const updateData = {
      value: 'updated value',
      description: 'Updated description'
    };

    settingsService.updateSetting.and.returnValue(of({
      success: true,
      message: 'Setting updated successfully',
      data: { ...mockSettings[0], ...updateData }
    }));

    component.selectedSetting = mockSettings[0];
    component.settingForm = { ...mockSettings[0], ...updateData };
    component.isEditMode = true;
    
    component.saveSetting();
    
    expect(settingsService.updateSetting).toHaveBeenCalledWith('1', updateData);
  });

  it('should delete setting', () => {
    settingsService.deleteSetting.and.returnValue(of({
      success: true,
      message: 'Setting deleted successfully'
    }));

    spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteSetting(mockSettings[0]);
    
    expect(settingsService.deleteSetting).toHaveBeenCalledWith('1');
  });

  it('should export settings', () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      settings: mockSettings.map(s => ({
        key: s.key,
        value: s.value,
        description: s.description,
        category: s.category,
        dataType: s.dataType
      }))
    };

    settingsService.exportSettings.and.returnValue(of(exportData));
    
    // Mock URL.createObjectURL and document.createElement
    const mockUrl = 'blob:test';
    const mockLink = document.createElement('a');
    spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
    spyOn(window.URL, 'revokeObjectURL');
    spyOn(document, 'createElement').and.returnValue(mockLink);
    spyOn(mockLink, 'click');
    
    component.exportSettings();
    
    expect(settingsService.exportSettings).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });

  it('should reset settings to defaults', () => {
    settingsService.resetSettingsToDefaults.and.returnValue(of({
      success: true,
      message: 'Settings reset to defaults successfully'
    }));

    spyOn(window, 'confirm').and.returnValue(true);
    
    component.resetToDefaults();
    
    expect(settingsService.resetSettingsToDefaults).toHaveBeenCalled();
  });

  it('should handle pagination changes', () => {
    component.filteredSettings = Array.from({ length: 25 }, (_, i) => ({
      ...mockSettings[0],
      id: i.toString()
    }));
    component.itemsPerPage = 10;
    
    component.updatePagination();
    
    expect(component.totalPages).toBe(3);
    expect(component.paginatedSettings.length).toBe(10);
  });

  it('should change page', () => {
    component.currentPage = 1;
    component.totalPages = 3;
    
    component.onPageChange(2);
    
    expect(component.currentPage).toBe(2);
  });

  it('should change items per page', () => {
    component.currentPage = 3;
    
    component.onItemsPerPageChange();
    
    expect(component.currentPage).toBe(1);
  });

  it('should close modal', () => {
    component.isAddMode = true;
    component.isEditMode = true;
    component.isViewMode = true;
    component.selectedSetting = mockSettings[0];
    
    component.closeModal();
    
    expect(component.isAddMode).toBe(false);
    expect(component.isEditMode).toBe(false);
    expect(component.isViewMode).toBe(false);
    expect(component.selectedSetting).toBeNull();
  });

  it('should populate form for editing', () => {
    component.editSetting(mockSettings[0]);
    
    expect(component.isEditMode).toBe(true);
    expect(component.isAddMode).toBe(false);
    expect(component.isViewMode).toBe(false);
    expect(component.selectedSetting).toBe(mockSettings[0]);
    expect(component.settingForm.key).toBe(mockSettings[0].key);
  });

  it('should populate form for viewing', () => {
    component.viewSetting(mockSettings[0]);
    
    expect(component.isViewMode).toBe(true);
    expect(component.isAddMode).toBe(false);
    expect(component.isEditMode).toBe(false);
    expect(component.selectedSetting).toBe(mockSettings[0]);
  });

  it('should add new setting mode', () => {
    component.addSetting();
    
    expect(component.isAddMode).toBe(true);
    expect(component.isEditMode).toBe(false);
    expect(component.isViewMode).toBe(false);
    expect(component.selectedSetting).toBeNull();
  });

  it('should format setting value correctly', () => {
    settingsService.formatSettingValue.and.returnValue('Yes');
    
    const result = component.formatValue(mockSettings[1]);
    
    expect(settingsService.formatSettingValue).toHaveBeenCalledWith(mockSettings[1]);
    expect(result).toBe('Yes');
  });

  it('should get data type label', () => {
    const result = component.getDataTypeLabel('boolean');
    
    expect(result).toBe('Yes/No');
  });
});
















