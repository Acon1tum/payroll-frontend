import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { AttendanceComponent } from './attendance.component';
import { AttendanceService } from '../../../services/attendance.service';
import { AuthService } from '../../../services/auth.service';

describe('AttendanceComponent', () => {
  let component: AttendanceComponent;
  let fixture: ComponentFixture<AttendanceComponent>;
  let mockAttendanceService: jasmine.SpyObj<AttendanceService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const attendanceServiceSpy = jasmine.createSpyObj('AttendanceService', [
      'clockIn', 'clockOut', 'startBreak', 'endBreak', 'getCurrentDayAttendance', 'getTimeLogs', 'getEmployeeMonthlyAttendance'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: { employee: { id: 'test-employee-id' } }
    });

    await TestBed.configureTestingModule({
      imports: [
        AttendanceComponent,
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        { provide: AttendanceService, useValue: attendanceServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    mockAttendanceService = TestBed.inject(AttendanceService) as jasmine.SpyObj<AttendanceService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current user employee ID', () => {
    expect(component.currentEmployeeId).toBe('test-employee-id');
  });

  it('should have breadcrumbs configured', () => {
    expect(component.breadcrumbs).toBeDefined();
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('Home');
    expect(component.breadcrumbs[1].label).toBe('Attendance');
  });

  it('should start time update on init', () => {
    spyOn(component, 'startTimeUpdate');
    component.ngOnInit();
    expect(component.startTimeUpdate).toHaveBeenCalled();
  });

  it('should clean up interval on destroy', () => {
    spyOn(window, 'clearInterval');
    component.ngOnDestroy();
    expect(window.clearInterval).toHaveBeenCalled();
  });
});
