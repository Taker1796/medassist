import {HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {AuthService} from '../services/auth-service';
import {inject} from '@angular/core';
import {BehaviorSubject, catchError, filter, switchMap, tap, throwError} from 'rxjs';

let isRefreshing$ = new BehaviorSubject(false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);
  const token = authService.GetToken;

  //никогда не трогаем auth-запрос
  if (req.url.includes('/token')) {
    return next(req);
  }

  if(!token){
    return next(req);
  }

  if(isRefreshing$.value){
    return refreshToken(authService, req, next);
  }

  return next(setToken(req, token)).pipe(

    tap(token => console.log('Me Request body:', JSON.stringify(req, null, 2))),

    catchError(err => {
      if(err.status == 403) {
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

  if(!isRefreshing$.value){
    isRefreshing$.next(true);

    return authService.Authenticate().pipe(
      //switchMap здесь нужен, чтобы
      //после успешного refresh токена — выполнить исходный HTTP-запрос и вернуть ЕГО результат
      switchMap(result => {

        let token = authService.GetToken;
        if(!token){
          return throwError(() => new Error('не удалось обновить токен'));
        }

        //next в данном случае выполняет исходный запрос(req) повторно
        //ты сам в коде это указываешь - next -> выполни запрос
        return next(setToken(req, token)).pipe(
          tap(() => {
            isRefreshing$.next(false);
          })
        );
      })
    )
  }

  return isRefreshing$.pipe(
    filter(isRefreshing => !isRefreshing),
    switchMap(resp => {
      return next(setToken(req, authService.GetToken!));
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
