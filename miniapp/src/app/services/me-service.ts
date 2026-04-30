import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {catchError, map, Observable, of, shareReplay, tap, throwError} from 'rxjs';
import {MeResponse} from '../models/meResponse.model';
import {UpdateMeRequest} from '../models/updateMeRequest.model';
import {Specialization} from '../models/specializationModel';
import {UpdateSpecialization} from '../models/updateSpecializationRequest.model';

@Injectable({
  providedIn: 'root',
})
export class MeService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _meCache$: Observable<MeResponse> | null = null;

  me(forceRefresh = false) : Observable<MeResponse> {
    if (forceRefresh) {
      this._meCache$ = null;
    }

    if (!this._meCache$) {
      this._meCache$ = this._http.get<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}`).pipe(
        shareReplay(1),
        catchError((error: unknown) => {
          this._meCache$ = null;
          return throwError(() => error);
        })
      );
    }

    return this._meCache$;
  }

  getRegistrationStatus(): Observable<boolean>{
    return this.me().pipe(
      map((regStatus: MeResponse) => !!regStatus?.doctorId),
      catchError((error: unknown) => {
        console.error('Ошибка запроса:', error);
        return of(false);
      })
    );
  }

  update(body: UpdateMeRequest): Observable<MeResponse> {
    return this._http.patch<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}`, body).pipe(
      tap((me: MeResponse) => {
        this._meCache$ = of(me);
      })
    );
  }

  changeSpecialization(value: string|null){

    const body: UpdateSpecialization = {
      code: value
    }

    return this._http.patch<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}/specialization`, body).pipe(
      tap((me: MeResponse) => {
        this._meCache$ = of(me);
      })
    );
  }
}
