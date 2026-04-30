import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {catchError, map, Observable, of, tap, throwError} from 'rxjs';
import {AuthResponseModel} from '../models/authResponse.model';
import {Router} from '@angular/router';
import {AuthRequestModel} from '../models/authRequest.model';

interface AuthSession {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  actorType: string;
  doctorId: string | null;
  login: string | null;
  password: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _router = inject(Router);
  private readonly _sessionStorageKey = 'medassist.web.session';
  private _session: AuthSession | null = this.readSession();

  get IsAuth(): boolean {
    return !!this._session?.accessToken && this._session.expiresAt > Date.now();
  }

  get HasRefreshCredentials(): boolean {
    return !!this._session?.login && !!this._session?.password;
  }

  get GetToken(): string | null {
    if (!this.IsAuth) {
      if (!this.HasRefreshCredentials) {
        this.clearSession();
      }
      return null;
    }

    return this._session?.accessToken ?? null;
  }

  isTokenExpiringSoon(leewayMs = 60_000): boolean {
    if (!this._session?.accessToken) {
      return true;
    }

    return this._session.expiresAt <= Date.now() + leewayMs;
  }

  Authenticate(forceRefresh = false): Observable<boolean> {
    if (!forceRefresh && this.IsAuth && !this.isTokenExpiringSoon()) {
      return of(true);
    }

    if (!this.HasRefreshCredentials) {
      return of(false);
    }

    return this.refreshAccessToken().pipe(
      map((token: string | null) => !!token),
      catchError(() => of(false))
    );
  }

  login(login: string, password: string): Observable<AuthResponseModel> {
    const body: AuthRequestModel = {
      type: 'password',
      payload: {
        login,
        password
      }
    };

    return this.requestAuth(`${this._baseUrl}${Environment.authUrlPath}/token`, body, {login, password});
  }

  register(body: {
    login: string;
    password: string;
    nickname: string;
    specializationCodes: string[];
  }): Observable<AuthResponseModel> {
    return this.requestAuth(`${this._baseUrl}${Environment.authUrlPath}/register`, body, {
      login: body.login,
      password: body.password
    });
  }

  refreshAccessToken(): Observable<string | null> {
    if (!this.HasRefreshCredentials) {
      return of(null);
    }

    const credentials = {
      login: this._session?.login ?? '',
      password: this._session?.password ?? ''
    };

    const body: AuthRequestModel = {
      type: 'password',
      payload: credentials
    };

    return this.requestAuth(`${this._baseUrl}${Environment.authUrlPath}/token`, body, credentials).pipe(
      map((response: AuthResponseModel) => response.accessToken ?? null)
    );
  }

  logout(redirectToLogin = true): void {
    this.clearSession();

    if (redirectToLogin) {
      void this._router.navigate(['/login']);
    }
  }

  handleUnauthorized(): void {
    this.logout();
  }

  getErrorMessage(error: unknown, fallback: string): string {
    const payload = (error as { error?: { error?: string; title?: string; detail?: string } })?.error;
    return payload?.error || payload?.title || payload?.detail || fallback;
  }

  private requestAuth(
    url: string,
    body: object,
    credentials?: { login: string; password: string }
  ): Observable<AuthResponseModel> {
    return this._http.post<AuthResponseModel>(url, body).pipe(
      tap((response: AuthResponseModel) => {
        if (!response?.accessToken) {
          throw new Error('Токен не получен');
        }

        this.persistSession(response, credentials);
      }),
      catchError((error: unknown) => {
        if (!this.IsAuth) {
          this.clearSession();
        }
        return throwError(() => error);
      })
    );
  }

  private persistSession(
    response: AuthResponseModel,
    credentials?: { login: string; password: string }
  ): void {
    const login = credentials?.login ?? this._session?.login ?? null;
    const password = credentials?.password ?? this._session?.password ?? null;

    this._session = {
      accessToken: response.accessToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
      tokenType: response.tokenType,
      actorType: response.actorType,
      doctorId: response.doctorId ?? null,
      login,
      password
    };

    sessionStorage.setItem(this._sessionStorageKey, JSON.stringify(this._session));
  }

  private readSession(): AuthSession | null {
    const rawSession = sessionStorage.getItem(this._sessionStorageKey);
    if (!rawSession) {
      return null;
    }

    try {
      const parsedSession = JSON.parse(rawSession) as AuthSession;
      if (!parsedSession.login || !parsedSession.password) {
        sessionStorage.removeItem(this._sessionStorageKey);
        return null;
      }

      if (!parsedSession.accessToken) {
        sessionStorage.removeItem(this._sessionStorageKey);
        return null;
      }

      return parsedSession;
    } catch {
      sessionStorage.removeItem(this._sessionStorageKey);
      return null;
    }
  }

  private clearSession(): void {
    this._session = null;
    sessionStorage.removeItem(this._sessionStorageKey);
  }
}
