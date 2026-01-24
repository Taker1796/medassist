import { HttpInterceptorFn } from '@angular/common/http';
import {TgService} from '../services/tg-service';
import {inject} from '@angular/core';

export const customHeaderInterceptor: HttpInterceptorFn = (req, next) => {

  const tgService = inject(TgService)

  if (!tgService.userName) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'X-Telegram-User-Id': tgService.userName
      }
    })
  );
};
