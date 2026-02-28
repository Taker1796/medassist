import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const apiKey = authService.getApiKey();
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  // Bypass ngrok browser warning interstitial for API calls.
  if (req.url.includes('.ngrok-free.dev')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (!Object.keys(headers).length) {
    return next(req);
  }

  return next(req.clone({ setHeaders: headers }));
};
