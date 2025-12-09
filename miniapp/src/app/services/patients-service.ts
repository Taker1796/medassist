import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {PatientCreateRequestModel} from '../models/createPatientRequest.model';
import {Observable, of} from 'rxjs';
import {PatientCreateResponseModel} from '../models/createPatientResponse.model';

@Injectable({
  providedIn: 'root',
})
export class PatientsService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _patientsUrlPath = Environment.patientsUrlPath;

  create(body:PatientCreateRequestModel):Observable<PatientCreateRequestModel> {
    return this._http.post<PatientCreateRequestModel>(`${this._baseUrl}${this._patientsUrlPath}`,body);
  }

  getList(): Observable<PatientCreateResponseModel[]>{
    return this._http.get<PatientCreateResponseModel[]>(`${this._baseUrl}${this._patientsUrlPath}`);
  }

}
