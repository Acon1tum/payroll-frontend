import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appRole]',
  standalone: true
})
export class RoleDirective implements OnInit, OnDestroy {
  @Input() appRole: string | string[] = '';
  @Input() appRoleOperator: 'AND' | 'OR' = 'OR';
  
  private hasView = false;
  private subscription: Subscription | null = null;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.updateView();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private updateView() {
    const hasAccess = this.checkAccess();
    
    if (hasAccess && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkAccess(): boolean {
    if (!this.appRole || this.appRole.length === 0) {
      return true;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return false;
    }

    const requiredRoles = Array.isArray(this.appRole) ? this.appRole : [this.appRole];
    
    if (this.appRoleOperator === 'AND') {
      // User must have ALL required roles
      return requiredRoles.every(role => this.authService.hasRole(role));
    } else {
      // User must have AT LEAST ONE of the required roles (OR)
      return requiredRoles.some(role => this.authService.hasRole(role));
    }
  }
}
