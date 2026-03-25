import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    if (this.auth.user?.role !== 'customer') {
      return this.router.createUrlTree(['/owner']);
    }
    return true;
  }
}
