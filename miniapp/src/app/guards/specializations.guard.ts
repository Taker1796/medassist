import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';
import {MeService} from '../services/me-service';
import {map, of, switchMap} from 'rxjs';
import {AuthService} from '../services/auth-service';

export const SpecializationsGuard = ()=> {

  const registrationService: RegistrationService = inject(RegistrationService);
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Проверяем авторизацию
  if (authService.IsAuth) {
    // токен уже есть
    return checkSpecializationEnabled();
  }

  // токен отсутствует → авторизация через Authenticate()
  return authService.Authenticate().pipe(
    switchMap(isAuth => {
      if (!isAuth) {
        // пользователь не авторизован → редирект на /isnottelegram
        return of(router.createUrlTree(['/isnottelegram']));
      }
      // авторизован → проверяем доступность просмотра специализаций
      return checkSpecializationEnabled();
    })
  );

  function checkSpecializationEnabled() {
    const isSpecializationsEnabled = registrationService.isSpecializationsEnabled;
    const isRegistered = registrationService.isRegistered;
    if (isSpecializationsEnabled || isRegistered) {
      return of(true);
    }

    return of(router.createUrlTree(['/registration']));
  }
}
