import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {AuthService} from '../services/auth-service';
import {inject} from '@angular/core';
import {catchError, throwError} from 'rxjs';
import {Environment} from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.GetToken;

  if (req.url.includes('/token') || req.url.includes('/register')) {
    if (!Environment.production) {
      return next(req.clone({
        setHeaders: {
          Authorization: `ApiKey ma_dev_CFcqmRsL65yL1qaF32yky7ntL6sVduttRcsT8t_md1s`
        }
      }));
    }

    return next(req);
  }

  if (!token) {
    authService.handleUnauthorized();
    return throwError(() => new Error('Отсутствует токен авторизации'));
  }

  return next(setToken(req, token)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authService.handleUnauthorized();
      }

      return throwError(() => err);
    })
  );
};

const setToken =
  (req : HttpRequest<any>,
   token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  })
}
