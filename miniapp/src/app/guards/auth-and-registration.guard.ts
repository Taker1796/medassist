import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';
import {map, of, switchMap, take} from 'rxjs';
import {MeService} from '../services/me-service';
import {AuthService} from '../services/auth-service';

export const AuthAndRegistrationGuard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const registrationService = inject(RegistrationService);
  const meService = inject(MeService);

  // 1. Проверяем авторизацию
  if (authService.IsAuth) {
    // токен уже есть
    return checkRegistration();
  }

  // токен отсутствует → авторизация через Authenticate()
  return authService.Authenticate().pipe(
    switchMap(isAuth => {
      if (!isAuth) {
        // пользователь не авторизован → редирект на /isnottelegram
        return of(router.createUrlTree(['/isnottelegram']));
      }
      // авторизован → проверяем регистрацию
      return checkRegistration();
    })
  );

  // Вспомогательная функция для проверки регистрации
  function checkRegistration() {
    if (registrationService.isRegistered) {
      return of(true);
    }

    return meService.getRegistrationStatus().pipe(
      map(isRegistered => {
        if (isRegistered) return true;
        return router.createUrlTree(['/registration']);
      })
    );
  }
};
