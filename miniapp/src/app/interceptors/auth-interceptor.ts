import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {AuthService} from '../services/auth-service';
import {inject} from '@angular/core';
import {BehaviorSubject, catchError, filter, finalize, switchMap, throwError} from 'rxjs';
import {Environment} from '../environments/environment';

let isRefreshing$ = new BehaviorSubject(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const token = authService.GetToken;

  if (req.url.includes('/token')) {
    if (!Environment.production) {
      return next(req.clone({
        setHeaders: {
          Authorization: `ApiKey ma_dev_CFcqmRsL65yL1qaF32yky7ntL6sVduttRcsT8t_md1s`
        }
      }));
    }

    return next(req);
  }

  if (isRefreshing$.value) {
    return refreshToken(authService, req, next);
  }

  if (!token) {
    return refreshToken(authService, req, next);
  }

  return next(setToken(req, token)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return refreshToken(authService, req, next);
      }

      return throwError(() => err);
    })
  );
};

const refreshToken =
  (authService : AuthService,
   req : HttpRequest<any>,
   next: HttpHandlerFn) => {

  if (!isRefreshing$.value) {
    isRefreshing$.next(true);

    return authService.Authenticate().pipe(
      switchMap((isAuthSuccess: boolean) => {
        const refreshedToken = authService.GetToken;
        if (!isAuthSuccess || !refreshedToken) {
          return throwError(() => new Error('не удалось обновить токен'));
        }

        return next(setToken(req, refreshedToken));
      }),
      finalize(() => isRefreshing$.next(false))
    )
  }

  return isRefreshing$.pipe(
    filter(isRefreshing => !isRefreshing),
    switchMap(() => {
      const refreshedToken = authService.GetToken;
      if (!refreshedToken) {
        return throwError(() => new Error('токен отсутствует после обновления'));
      }

      return next(setToken(req, refreshedToken));
    })
  );
}

const setToken =
  (req : HttpRequest<any>,
   token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  })
}
