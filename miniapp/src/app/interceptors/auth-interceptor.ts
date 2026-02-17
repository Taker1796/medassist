import {HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {AuthService} from '../services/auth-service';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const token = authService.GetToken;

  if(!token){
    return next(req);
  }

  if(isRefreshing){
    return refreshToken(authService, req, next);
  }

  return next(setToken(req, token)).pipe(
    catchError(err => {
      if(err.status == 401) {
        return refreshToken(authService, req, next);
      }

      return throwError(err);
    })
  );
};

const refreshToken =
  (authService : AuthService,
   req : HttpRequest<any>,
   next: HttpHandlerFn) => {

  if(!isRefreshing){
    isRefreshing = true;

    return authService.Authenticate().pipe(
      //switchMap здесь нужен, чтобы
      //после успешного refresh токена — выполнить исходный HTTP-запрос и вернуть ЕГО результат
      switchMap(result => {

        isRefreshing = false;

        let token = authService.GetToken;
        if(!token){
          return throwError(() => new Error('не удалось обновить токен'));
        }

        //next в данном случае выполняет исходный запрос(req) повторно
        //ты сам в коде это указываешь - next -> выполни запрос
        return next(setToken(req, token));
      })
    )
  }

  return next(setToken(req, authService.GetToken!));
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
