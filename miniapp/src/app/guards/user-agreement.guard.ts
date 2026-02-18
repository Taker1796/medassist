import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';
import {of, switchMap} from 'rxjs';
import {AuthService} from '../services/auth-service';

export const UserAgreementGuard = ()=> {

  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Проверяем авторизацию
  if (authService.IsAuth) {
    // токен уже есть
    return checkAgreementEnabled();
  }

  // токен отсутствует → авторизация через Authenticate()
  return authService.Authenticate().pipe(
    switchMap(isAuth => {
      if (!isAuth) {
        // пользователь не авторизован → редирект на /isnottelegram
        return of(router.createUrlTree(['/isnottelegram']));
      }
      // авторизован → проверяем доступность соглашения юзера
      return checkAgreementEnabled();
    })
  );

  function checkAgreementEnabled() {
    const isUserAgreementEnabled = inject(RegistrationService).isUserAgreementEnabled;
    if(isUserAgreementEnabled){
      return of(true);
    }

    return of(router.createUrlTree(['/registration']));
  }
}
