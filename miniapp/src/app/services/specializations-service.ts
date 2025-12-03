import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {Specialization} from '../models/specializationModel';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpecializationsService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _specializationUrlPath = Environment.specializationUrlPath;

  getList() : Observable<Specialization[]>{
    return this._http.get<Specialization[]>(`${this._baseUrl}${this._specializationUrlPath}`);
  }
}
