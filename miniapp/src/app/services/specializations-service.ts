import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {Specialization} from '../models/specializationModel';
import {catchError, Observable, shareReplay, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpecializationsService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _specializationUrlPath = Environment.specializationUrlPath;
  private _specializationsCache$: Observable<Specialization[]> | null = null;

  getList(forceRefresh = false): Observable<Specialization[]>{
    if (forceRefresh) {
      this._specializationsCache$ = null;
    }

    if (!this._specializationsCache$) {
      this._specializationsCache$ = this._http
        .get<Specialization[]>(`${this._baseUrl}${this._specializationUrlPath}`)
        .pipe(
          shareReplay(1),
          catchError((error: unknown) => {
            this._specializationsCache$ = null;
            return throwError(() => error);
          })
        );
    }

    return this._specializationsCache$;
  }
}
