import { Injectable ,inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Environment } from '../environments/environment';
import { RegistrationStatus } from '../models/regirstrationStatus.model';
import { catchError, EMPTY, map, Observable, of, tap } from 'rxjs';
import {CreateRegistrationRequestModel} from '../models/createRegistrationRequest.model';
import {CreateRegistrationResponseModel} from '../models/createRegistrationResponse.model';
import {Router} from '@angular/router';
import {TgService} from './tg-service';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {

  isUserAgreementEnabled = false;
  isSpecializationsEnabled = false;
  isRegistered : boolean = false;

  private _http: HttpClient = inject(HttpClient);
  private _tgService = inject(TgService);
  private _baseUrl = Environment.apiUrl;
  private _router = inject(Router);

  register(specializations:string[]){

    if(!this._tgService.userName){
      alert("Регистрация невозможна. Не получен tgUserName");
      return;
    }

    let body: CreateRegistrationRequestModel = {
      telegramUserId: this._tgService.id,
      specializationCodes: specializations,
      nickname: this._tgService.userName
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

  delete(){
    this._http.delete(`${this._baseUrl}${Environment.registrationUrlPath}`)
      .subscribe(value => {
      this.isRegistered = false;
      this._router.navigate([''])
    });
  }
}
