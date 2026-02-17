import {Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth-service';
import {map} from 'rxjs';

export const AuthGuard= ()=> {

  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.IsAuth) {
    return true;
  }

  return authService.Authenticate().pipe(
    map(isAllow => {
      if (isAllow) return true;
      return router.createUrlTree(['/isnottelegram']);
    })
  );

}
