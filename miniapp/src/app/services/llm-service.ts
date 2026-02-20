import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {Observable} from 'rxjs';
import {LlmResponse} from '../models/llmResponse.model';
import {LlmRequest} from '../models/llmRequest.model';

@Injectable({
  providedIn: 'root',
})

export class LlmService {

  private _http: HttpClient = inject(HttpClient)
  private _baseUrl = Environment.apiUrl;

  ask(body: LlmRequest):Observable<LlmResponse> {
    return this._http.post<LlmResponse>(`${this._baseUrl}${Environment.botChatUrlPath}/ask`, body);
  }
}
