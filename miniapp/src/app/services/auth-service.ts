import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {catchError, Observable, of, tap, throwError} from 'rxjs';
import {AuthResponseModel} from '../models/authResponse.model';
import {Router} from '@angular/router';
import {AuthRequestModel} from '../models/authRequest.model';

interface AuthSession {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  actorType: string;
  doctorId: string | null;
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

  get GetToken(): string | null {
    if (!this.IsAuth) {
      this.clearSession();
      return null;
    }

    return this._session?.accessToken ?? null;
  }

  Authenticate(): Observable<boolean> {
    return of(this.IsAuth);
  }

  login(login: string, password: string): Observable<AuthResponseModel> {
    const body: AuthRequestModel = {
      type: 'password',
      payload: {
        login,
        password
      }
    };

    return this.requestAuth(`${this._baseUrl}${Environment.authUrlPath}/token`, body);
  }

  register(body: {
    login: string;
    password: string;
    nickname: string;
    specializationCodes: string[];
  }): Observable<AuthResponseModel> {
    return this.requestAuth(`${this._baseUrl}${Environment.authUrlPath}/register`, body);
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

  private requestAuth(url: string, body: object): Observable<AuthResponseModel> {
    return this._http.post<AuthResponseModel>(url, body).pipe(
      tap((response: AuthResponseModel) => {
        if (!response?.accessToken) {
          throw new Error('Токен не получен');
        }

        this.persistSession(response);
      }),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  private persistSession(response: AuthResponseModel): void {
    this._session = {
      accessToken: response.accessToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
      tokenType: response.tokenType,
      actorType: response.actorType,
      doctorId: response.doctorId ?? null
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
      if (!parsedSession.accessToken || parsedSession.expiresAt <= Date.now()) {
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
