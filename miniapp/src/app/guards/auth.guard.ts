import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth-service';
import {map} from 'rxjs';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.Authenticate().pipe(
    map((isAuthenticated: boolean) => isAuthenticated ? true : router.createUrlTree(['/login']))
  );
};
