import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {Observable} from 'rxjs';
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

  me() : Observable<MeResponse> {
    return this._http.get<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}`);
  }

  update(): Observable<MeResponse> {

    const body :UpdateMeRequest = {
      specializations: [],
      nickname:"",
      lastSelectedPatientId:"sdad"
    };

    return this._http.patch<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}`, body);
  }

  changeSpecialization(value: string){

    const body: UpdateSpecialization = {
      code: value
    }

    return this._http.patch<MeResponse>(`${this._baseUrl}${Environment.meUrlPath}/specialization`, body);
  }
}


