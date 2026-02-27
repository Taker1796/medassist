import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const apiKey = authService.getApiKey();

  if (!apiKey) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'X-API-Key': apiKey
      }
    })
  );
};
