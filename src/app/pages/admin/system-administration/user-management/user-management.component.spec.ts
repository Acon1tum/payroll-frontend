import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagementComponent } from './user-management.component';
import { UserService } from '../../../../services/user.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UserService', ['getUsers', 'createUser', 'updateUser', 'deleteUser', 'changePassword', 'assignRole']);
    
    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: UserService, useValue: spy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.users).toEqual([]);
    expect(component.filteredUsers).toEqual([]);
    expect(component.currentTab).toBe('list');
    expect(component.isLoading).toBe(false);
  });

  it('should load users on init', () => {
    spyOn(component, 'loadUsers');
    component.ngOnInit();
    expect(component.loadUsers).toHaveBeenCalled();
  });

  it('should filter users correctly', () => {
    component.users = [
      {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    component.searchTerm = 'test';
    component.filterUsers();
    expect(component.filteredUsers.length).toBe(1);
  });

  it('should clear filters', () => {
    component.searchTerm = 'test';
    component.selectedRole = 'admin';
    component.clearFilters();
    expect(component.searchTerm).toBe('');
    expect(component.selectedRole).toBe('');
  });
});
