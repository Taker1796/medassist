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
  private _token: string | null = null;

  get IsAuth(){
    if(!this._token){
      this._token = this._cookiesService.get('token');
    }

    return !!this._token;
  }

  get GetToken(){
    if(!this._token){
      this._token = this._cookiesService.get('token');
    }

    return this._token;
  }

  Authenticate(): Observable<boolean> {

    if (this._tgService.initData) {

      const body = {
        type: "telegram_init_data",
        payload: {
          initData: `${this._tgService.initData}`
        }
      }

      console.log('Request body:', JSON.stringify(body, null, 2));

      return this._http.post<AuthResponseModel>(`${this._baseUrl}${Environment.authUrlPath}/token`, body).pipe(
        tap(response => {
          if(response.accessToken != null && response.accessToken != "") {
            this._token = response.accessToken;
            this._cookiesService.set('token', response.accessToken);
          }
          else{
            this.logout();
          }
        }),

        map(response => response.accessToken != null && response.accessToken != ""),

        catchError(error => {

          this.logout();

          console.error('Ошибка запроса:', error);
          return of(false);
        })
      );
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
}
