import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {catchError, EMPTY, map, Observable, of, tap} from 'rxjs';
import {AuthRequestModel} from '../models/authRequest.model';
import {AuthResponseModel} from '../models/authResponse.model';
import {TgService} from './tg-service';
import {CookieService} from 'ngx-cookie-service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _tgService = inject(TgService);
  private _cookiesService = inject(CookieService);
  private _router = inject(Router);
  private _token = this._cookiesService.get('token') || null;

  get IsAuth(){
    return !!this._token;
  }

  get GetToken(){
    return this._token;
  }

  Authenticate(): Observable<boolean> {

    if(!Environment.production){
      const body = {
        type: "api_key",
        payload: {}
      }

      return this.Auth(body);
    }

    if (Environment.production && this._tgService.initData) {

      const body = {
        type: "telegram_init_data",
        payload: {
          initData: `${this._tgService.initData}`
        }
      }

      console.log('Request body:', JSON.stringify(body, null, 2));

      return this.Auth(body);
    }
    else{
      this.logout();
      return of(false);
    }
  }

  logout(){
    this._token = null;
    this._cookiesService.delete('token');
    this._router.navigate(['/isnottelegram']);
  }

  private Auth(body: object){
    return this._http.post<AuthResponseModel>(`${this._baseUrl}${Environment.authUrlPath}/token`, body).pipe(

      map(response => {
        if (!response?.accessToken) {
          this.logout();
          return false;
        }

        this._token = response.accessToken;
        this._cookiesService.set('token', response.accessToken);

        return true;
      }),

      catchError(error => {

        this.logout();

        console.error('Ошибка запроса:', error);
        return of(false);
      })
    );
  }
}
