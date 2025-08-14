import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Components
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

// Directives
import { RoleDirective } from './directives/role.directive';

// Guards
import { AuthGuard } from '../guards/auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { LoggedInGuard } from '../guards/logged-in.guard';
import { UnauthorizedAccessGuard } from '../guards/unauthorized-access.guard';

// Services
import { NavigationService } from '../services/navigation.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    // Standalone components
    UnauthorizedComponent,
    RoleDirective
  ],
  exports: [
    CommonModule,
    RouterModule,
    UnauthorizedComponent,
    RoleDirective
  ],
  providers: [
    AuthGuard,
    RoleGuard,
    LoggedInGuard,
    UnauthorizedAccessGuard,
    NavigationService
  ]
})
export class SharedModule { }
