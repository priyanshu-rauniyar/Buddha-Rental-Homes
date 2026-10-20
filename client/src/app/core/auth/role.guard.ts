import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { UserRole } from '../models/api.models';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as UserRole;

  return auth.restoreSession().pipe(map((user) => {
    if (!user) return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
    if (user.role !== requiredRole) return router.createUrlTree([`/${user.role}`]);
    return true;
  }));
};
