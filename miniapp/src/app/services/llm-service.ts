import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {Observable, of, tap} from 'rxjs';
import {LlmResponse} from '../models/llmResponse.model';
import {LlmRequest} from '../models/llmRequest.model';
import {GeneralChatTurn} from '../models/generalChatTurn.model';
import {SseStreamService} from './sse-stream-service';

@Injectable({
  providedIn: 'root',
})

export class LlmService {

  private _http: HttpClient = inject(HttpClient)
  private _baseUrl = Environment.apiUrl;
  private _generalTurnsCache: GeneralChatTurn[] = [];
  private _sseStreamService = inject(SseStreamService);

  ask(body: LlmRequest):Observable<LlmResponse> {
    return this._http.post<LlmResponse>(`${this._baseUrl}${Environment.botChatUrlPath}/ask`, body);
  }

  askStream(body: LlmRequest): Observable<string> {
    const url = `${this._baseUrl}${Environment.botChatUrlPath}/ask/stream`;
    return this._sseStreamService.postStream(url, body);
  }

  getGeneralTurns(forceRefresh = false): Observable<GeneralChatTurn[]> {
    if (!forceRefresh && this._generalTurnsCache.length > 0) {
      return of(this._generalTurnsCache);
    }

    return this._http.get<GeneralChatTurn[]>(`${this._baseUrl}${Environment.meChatGeneralUrlPath}/turns`).pipe(
      tap((turns: GeneralChatTurn[]) => {
        this._generalTurnsCache = this.sortTurns(turns);
      })
    );
  }

  appendGeneralTurn(turn: GeneralChatTurn): void {
    this._generalTurnsCache = this.sortTurns([...this._generalTurnsCache, turn]);
  }

  clearGeneralTurns(): Observable<void> {
    return this._http.post<void>(`${this._baseUrl}${Environment.meChatGeneralUrlPath}/clear`, {}).pipe(
      tap(() => {
        this._generalTurnsCache = [];
      })
    );
  }

  private sortTurns(turns: GeneralChatTurn[]): GeneralChatTurn[] {
    return [...turns].sort((a: GeneralChatTurn, b: GeneralChatTurn) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
}
