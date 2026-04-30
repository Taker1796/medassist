import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {AuthService} from '../services/auth-service';
import {inject} from '@angular/core';
import {catchError, finalize, Observable, shareReplay, switchMap, throwError} from 'rxjs';
import {Environment} from '../environments/environment';

let refreshInFlight$: Observable<string | null> | null = null;

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

  if (!token || authService.isTokenExpiringSoon()) {
    return refreshToken(authService).pipe(
      switchMap((refreshedToken: string | null) => {
        if (!refreshedToken) {
          authService.handleUnauthorized();
          return throwError(() => new Error('Не удалось обновить токен авторизации'));
        }

        return next(setToken(req, refreshedToken));
      })
    );
  }

  return next(setToken(req, token)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return refreshToken(authService).pipe(
          switchMap((refreshedToken: string | null) => {
            if (!refreshedToken) {
              authService.handleUnauthorized();
              return throwError(() => err);
            }

            return next(setToken(req, refreshedToken));
          }),
          catchError((refreshError: unknown) => {
            authService.handleUnauthorized();
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => err);
    })
  );
};

const refreshToken = (authService: AuthService): Observable<string | null> => {
  if (!refreshInFlight$) {
    refreshInFlight$ = authService.refreshAccessToken().pipe(
      shareReplay(1),
      finalize(() => {
        refreshInFlight$ = null;
      })
    );
  }

  return refreshInFlight$;
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
