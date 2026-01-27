import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {MeResponse} from '../models/meResponse.model';
import {UpdateMeRequest} from '../models/updateMeRequest.model';
import {Specialization} from '../models/specializationModel';
import {UpdateSpecialization} from '../models/updateSpecializationRequest.model';
import {TgService} from './tg-service';
import {RegistrationService} from './registration-service';

@Injectable({
  providedIn: 'root',
})
export class MeService {
  private _http: HttpClient = inject(HttpClient);
  private _tgService = inject(TgService);
  private _regService = inject(RegistrationService);
  private _baseUrl = Environment.apiUrl;

  me() : Observable<MeResponse> {
    return this._http.get<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}`);
  }

  getRegistrationStatus(): Observable<boolean>{
    if(this._tgService.userName){
      return this.me().pipe(
        tap(regStatus => { this._regService.isRegistered = regStatus && !!regStatus.doctorId; }),
        map(regStatus => regStatus && !!regStatus.doctorId),
        catchError(error => {
          console.error('Ошибка запроса:', error);
          return of(false);
        }));
    }
    else {
      alert("Не удалось определить пользователя")
    }

    return of(false);
  }

  update(): Observable<MeResponse> {

    const body :UpdateMeRequest = {
      specializations: [],
      nickname:"",
      lastSelectedPatientId:"sdad"
    };

    return this._http.patch<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}`, body);
  }

  changeSpecialization(value: string|null){

    const body: UpdateSpecialization = {
      code: value
    }

    return this._http.patch<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}/specialization`, body);
  }
}


