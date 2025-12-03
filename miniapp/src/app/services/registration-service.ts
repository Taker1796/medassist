import { Injectable ,inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Environment } from '../environments/environment';
import { RegistrationStatus } from '../models/regirstrationStatus.model';
import {catchError, EMPTY, tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {

  isRegistered: boolean = false;
  isUserAgreementEnabled = false;
  isSpecializationsEnabled = false;
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _userName: string = window.Telegram?.WebApp?.initDataUnsafe?.user?.username?.test;

  setRegistrationStatus(){
    this._userName = 'Taker1796';
    if(this._userName){
      this._http.get<RegistrationStatus>(`${this._baseUrl}/${this._userName}`).pipe(
        tap(regStatus => this.isRegistered = regStatus && regStatus.humanInLoopConfirmed),
        catchError(error => {
          console.error('Ошибка запроса:', error);
          return EMPTY;
        })
      ).subscribe();
    }
  }

  register(){

  }

  unregister(){

  }
}
