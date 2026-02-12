import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, EMPTY, map, Observable, of} from 'rxjs';
import {Environment} from '../environments/environment';
import {StaticContentResponseModel} from '../models/staticContentResponse.model';

@Injectable({
  providedIn: 'root',
})
export class StaticContentService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;

  getUserAgreementText(): Observable<string> {
    const code = 'eula';

    return this._http.get<StaticContentResponseModel>(`${this._baseUrl}${Environment.staticContentUrlPath}/${code}`).pipe(
      map((res: StaticContentResponseModel) => {
        return res.value
      }),

      catchError(error => {
        console.error('Ошибка запроса:', error);
        return of("Не удалось получить текст соглашения");
      }));
  }
}
