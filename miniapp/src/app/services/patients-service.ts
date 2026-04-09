import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Environment} from '../environments/environment';
import {UpsertPatientRequest} from '../models/upsertPatientRequest.model';
import {Observable, of, tap} from 'rxjs';
import {PatientResponse} from '../models/patientResponse.model';
import {PatientVisit} from '../models/patientVisit.model';
import {CreatePatientChatConversationRequest} from '../models/createPatientChatConversationRequest.model';
import {CreatePatientChatConversationResponse} from '../models/createPatientChatConversationResponse.model';
import {PatientChatCurrentResponse} from '../models/patientChatCurrentResponse.model';
import {PatientChatTurn} from '../models/patientChatTurn.model';
import {PatientChatAskRequest} from '../models/patientChatAskRequest.model';
import {PatientChatAskResponse} from '../models/patientChatAskResponse.model';
import {PatientChatConversationHistory} from '../models/patientChatConversationHistory.model';
import {PatientChatConversationSummary} from '../models/patientChatConversationSummary.model';
import {SseStreamService} from './sse-stream-service';
import {PatientChatStatusResponse} from '../models/patientChatStatus.model';

@Injectable({
  providedIn: 'root',
})
export class PatientsService {
  private _http: HttpClient = inject(HttpClient);
  private _baseUrl = Environment.apiUrl;
  private _patientsUrlPath = Environment.patientsUrlPath;
  private _currentTurnsCacheByPatient: Record<string, PatientChatTurn[]> = {};
  private _sseStreamService = inject(SseStreamService);

  create(body:UpsertPatientRequest):Observable<UpsertPatientRequest> {
    return this._http.post<UpsertPatientRequest>(`${this._baseUrl}${this._patientsUrlPath}`,body);
  }

  getList(): Observable<PatientResponse[]>{
    return this._http.get<PatientResponse[]>(`${this._baseUrl}${this._patientsUrlPath}`);
  }

  getById(id:string): Observable<PatientResponse>{
    return this._http.get<PatientResponse>(`${this._baseUrl}${this._patientsUrlPath}/${id}`);
  }

  delete(id:string):Observable<Object> {
    return this._http.delete(`${this._baseUrl}${this._patientsUrlPath}/${id}`);
  }

  update(body:UpsertPatientRequest, id:string):Observable<UpsertPatientRequest> {
    return this._http.put<UpsertPatientRequest>(`${this._baseUrl}${this._patientsUrlPath}/${id}`,body);
  }

  getVisits(patientId: string): Observable<PatientVisit[]> {
    return this._http.get<PatientVisit[]>(`${this._baseUrl}${this._patientsUrlPath}/${patientId}/visits`);
  }

  createChatConversation(
    patientId: string,
    body: CreatePatientChatConversationRequest = {}
  ): Observable<CreatePatientChatConversationResponse> {
    const urlPath = Environment.patientsChatUrlPath.replace('{patientId}', encodeURIComponent(patientId));
    return this._http.post<CreatePatientChatConversationResponse>(`${this._baseUrl}${urlPath}`, body);
  }

  getChatConversations(patientId: string): Observable<PatientChatConversationHistory[]> {
    const urlPath = Environment.patientsChatUrlPath.replace('{patientId}', encodeURIComponent(patientId));
    const params = new HttpParams().set('_ts', Date.now().toString());
    return this._http.get<PatientChatConversationHistory[]>(`${this._baseUrl}${urlPath}`, {params});
  }

  getCurrentConversationStatus(patientId: string): Observable<PatientChatCurrentResponse> {
    const urlPath = Environment.patientsChatCurrentUrlPath.replace('{patientId}', encodeURIComponent(patientId));
    const params = new HttpParams().set('_ts', Date.now().toString());
    return this._http.get<PatientChatCurrentResponse>(`${this._baseUrl}${urlPath}`, {params});
  }

  getConversationSummary(patientId: string, conversationId: string): Observable<PatientChatConversationSummary> {
    const urlPath = Environment.patientsChatSummaryUrlPath
      .replace('{patientId}', encodeURIComponent(patientId))
      .replace('{conversationId}', encodeURIComponent(conversationId));

    return this._http.get<PatientChatConversationSummary>(`${this._baseUrl}${urlPath}`);
  }

  getCurrentConversationTurns(patientId: string, forceRefresh = false): Observable<PatientChatTurn[]> {
    const cachedTurns = this._currentTurnsCacheByPatient[patientId];
    if (!forceRefresh && cachedTurns) {
      return of(cachedTurns);
    }

    const urlPath = Environment.patientsChatCurrentTurnsUrlPath.replace('{patientId}', encodeURIComponent(patientId));
    return this._http.get<PatientChatTurn[]>(`${this._baseUrl}${urlPath}`).pipe(
      tap((turns: PatientChatTurn[]) => {
        this._currentTurnsCacheByPatient[patientId] = this.sortTurns(turns);
      })
    );
  }

  setCurrentConversationTurns(patientId: string, turns: PatientChatTurn[]): void {
    this._currentTurnsCacheByPatient[patientId] = this.sortTurns(turns);
  }

  appendCurrentConversationTurn(patientId: string, turn: PatientChatTurn): void {
    const turns = this._currentTurnsCacheByPatient[patientId] ?? [];
    this._currentTurnsCacheByPatient[patientId] = this.sortTurns([...turns, turn]);
  }

  askCurrentConversation(patientId: string, body: PatientChatAskRequest): Observable<PatientChatAskResponse> {
    const basePath = Environment.patientsChatCurrentUrlPath.replace('{patientId}', encodeURIComponent(patientId));
    return this._http.post<PatientChatAskResponse>(`${this._baseUrl}${basePath}/ask`, body);
  }

  askCurrentConversationStream(patientId: string, body: PatientChatAskRequest): Observable<string> {
    const basePath = Environment.patientsChatCurrentUrlPath.replace('{patientId}', encodeURIComponent(patientId));
    const streamUrl = `${this._baseUrl}${basePath}/ask/stream`;
    return this._sseStreamService.postStream(streamUrl, body);
  }

  completeCurrentConversation(patientId: string): Observable<PatientChatStatusResponse> {
    const basePath = Environment.patientsChatCurrentUrlPath.replace('{patientId}', encodeURIComponent(patientId));
    return this._http.post<PatientChatStatusResponse>(`${this._baseUrl}${basePath}/complete`, {}).pipe(
      tap(() => {
        this._currentTurnsCacheByPatient[patientId] = [];
      })
    );
  }

  private sortTurns(turns: PatientChatTurn[]): PatientChatTurn[] {
    return [...turns].sort((a: PatientChatTurn, b: PatientChatTurn) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
}
