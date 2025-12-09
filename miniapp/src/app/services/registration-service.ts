import { Injectable ,inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Environment } from '../environments/environment';
import { RegistrationStatus } from '../models/regirstrationStatus.model';
import { catchError, EMPTY, map, Observable, of, tap } from 'rxjs';
import {CreateRegistrationRequestModel} from '../models/createRegistrationRequest.model';
import {CreateRegistrationResponseModel} from '../models/createRegistrationResponse.model';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {

  isUserAgreementEnabled = false;
  isSpecializationsEnabled = false;
  isRegistered : boolean = false;

  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _tgUserName: string | null = null;
  private _userFirstName: string | null = null;
  private _userLastName: string | null = null;
  private _router = inject(Router);

  constructor() {
    let tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if(tgUser) {
      this._tgUserName = tgUser.username;
      this._userFirstName = tgUser.first_name;
      this._userLastName = tgUser.last_name;
    }
  }

  getRegistrationStatus(): Observable<boolean> {
    this._tgUserName = 'Taker1796';
    if(this._tgUserName){
      return this._http.get<RegistrationStatus>(`${this._baseUrl}${Environment.registrationUrlPath}/${this._tgUserName}`).pipe(
        tap(regStatus => { this.isRegistered = regStatus && regStatus.humanInLoopConfirmed; }),
        map(regStatus => regStatus && regStatus.humanInLoopConfirmed),
        catchError(error => {
          console.error('Ошибка запроса:', error);
          return of(false);
        }));
    }

    return of(false);
  }

  register(specializations:string[]){

    if(specializations.length == 0){
      alert('Для продолжения регистрации нужно выбрать минимум одну специализацию');
      return;
    }

    if(!this._tgUserName){
      alert("Регистрация невозможна. Не получен tgUserName");
      return;
    }

    let body: CreateRegistrationRequestModel = {
      displayName: `${this._userFirstName} ${this._userLastName}`,
      specializationCodes: specializations,
      telegramUsername: this._tgUserName,
      humanInLoopConfirmed: true,
      degrees: null,
      experienceYears: 0,
      languages: null,
      bio: null,
      focusAreas: null,
      acceptingNewPatients: true,
      location: null,
      contactPolicy: null,
      avatarUrl: null,
    }

    this._http.post<CreateRegistrationResponseModel>(`${this._baseUrl}${Environment.registrationUrlPath}`, body).pipe(
      catchError(error => {
        console.error('Ошибка запроса:', error);
        return EMPTY;
      })
    ).subscribe(value => {
      this.isRegistered = true;
      this._router.navigate([''])
    });

  }

  unregister(){

  }
}
