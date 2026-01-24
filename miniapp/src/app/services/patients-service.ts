import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {PatientCreateRequestModel} from '../models/createPatientRequest.model';
import {Observable, of} from 'rxjs';
import {PatientResponse} from '../models/patientResponse.model';
import {SelectPatientResponse} from '../models/selectPatientResponse.model';

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

  getList(): Observable<PatientResponse[]>{
    return this._http.get<PatientResponse[]>(`${this._baseUrl}${this._patientsUrlPath}`);
  }

  getById(id:number): Observable<PatientResponse>{
    return this._http.get<PatientResponse>(`${this._baseUrl}${this._patientsUrlPath}/${id}`);
  }

  delete(id:string):Observable<Object> {
    return this._http.delete(`${this._baseUrl}${this._patientsUrlPath}/${id}`);
  }

  setActive(id:string):Observable<SelectPatientResponse> {
    return this._http.post<SelectPatientResponse>(`${this._baseUrl}${this._patientsUrlPath}/${id}/setactive`,{});
  }
}
