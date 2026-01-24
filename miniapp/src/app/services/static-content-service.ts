import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, EMPTY, Observable, of} from 'rxjs';
import {Environment} from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StaticContentService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;

  getUserAgreementText(): Observable<string>  {
    const code = 5;

    return this._http.get<string>(`${this._baseUrl}${Environment.staticContentUrlPath}/${code}`).pipe(
      catchError(error => {
        console.error('Ошибка запроса:', error);
        return of("Не удалось получить текст соглашения");
      }));
  }
}
