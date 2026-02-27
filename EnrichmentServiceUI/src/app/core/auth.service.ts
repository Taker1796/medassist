import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { MockBackendService } from './mock-backend.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly backend = inject(MockBackendService);

  private readonly storageKey = 'enrichment-api-key';
  private readonly validatedAtKey = 'enrichment-api-key-validated-at';

  // 10 minutes. Change this constant to adjust re-auth period.
  private readonly keyTtlMs = 10 * 60 * 1000;

  startSessionGuard(router: Router): void {
    setInterval(() => {
      if (!this.isAuthorized()) {
        this.clearAuth();
        if (!router.url.startsWith('/auth')) {
          void router.navigate(['/auth'], {
            queryParams: { reason: 'expired' }
          });
        }
      }
    }, 15_000);
  }

  validateAndStoreKey(apiKey: string): Observable<boolean> {
    return this.backend.validateApiKey(apiKey).pipe(
      tap((isValid) => {
        if (isValid) {
          localStorage.setItem(this.storageKey, apiKey);
          localStorage.setItem(this.validatedAtKey, Date.now().toString());
          return;
        }

        this.clearAuth();
      })
    );
  }

  isAuthorized(): boolean {
    const apiKey = localStorage.getItem(this.storageKey);
    const validatedAt = Number(localStorage.getItem(this.validatedAtKey));

    if (!apiKey || !validatedAt) {
      return false;
    }

    return Date.now() - validatedAt < this.keyTtlMs;
  }

  getRemainingMs(): number {
    const validatedAt = Number(localStorage.getItem(this.validatedAtKey));
    if (!validatedAt) {
      return 0;
    }

    return Math.max(this.keyTtlMs - (Date.now() - validatedAt), 0);
  }

  clearAuth(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.validatedAtKey);
  }

  getApiKey(): string | null {
    if (!this.isAuthorized()) {
      return null;
    }

    return localStorage.getItem(this.storageKey);
  }

  getCanActivateResult(router: Router): boolean | ReturnType<Router['createUrlTree']> {
    if (this.isAuthorized()) {
      return true;
    }

    return router.createUrlTree(['/auth']);
  }
}
