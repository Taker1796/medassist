import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {Specialization} from '../models/specializationModel';
import {catchError, Observable, shareReplay, tap, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpecializationsService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _specializationUrlPath = Environment.specializationUrlPath;
  private _specializationsCache$: Observable<Specialization[]> | null = null;
  private _specializationsCacheUpdatedAt = 0;
  private readonly _specializationsCacheTtlMs = 5 * 60 * 1000;

  getList(forceRefresh = false): Observable<Specialization[]>{
    const isCacheStale = Date.now() - this._specializationsCacheUpdatedAt > this._specializationsCacheTtlMs;
    if (forceRefresh) {
      this._specializationsCache$ = null;
      this._specializationsCacheUpdatedAt = 0;
    } else if (isCacheStale) {
      this._specializationsCache$ = null;
    }

    if (!this._specializationsCache$) {
      this._specializationsCache$ = this._http
        .get<Specialization[]>(`${this._baseUrl}${this._specializationUrlPath}`)
        .pipe(
          // Обновляем таймштамп только при успешной загрузке.
          // Ошибка не должна "замораживать" протухший кэш.
          tap(() => {
            this._specializationsCacheUpdatedAt = Date.now();
          }),
          shareReplay(1),
          catchError((error: unknown) => {
            this._specializationsCache$ = null;
            this._specializationsCacheUpdatedAt = 0;
            return throwError(() => error);
          })
        );
    }

    return this._specializationsCache$;
  }
}
