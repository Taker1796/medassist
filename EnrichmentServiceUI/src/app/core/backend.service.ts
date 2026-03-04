import {inject, Injectable} from '@angular/core';
import {Observable, of, map, tap} from 'rxjs';
import {Environment} from '../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Template} from '../models/template.model';
import {UpsertTemplateModel} from '../models/upsertTemplate.model';
import {TemplateOption} from '../models/template-option.model';
import {LlmResponse} from '../models/llmResponse.model';
import {PatientCard} from '../models/patient-card.model';
import {AskDialogQuestionModel} from '../models/ask-dialog-question.model';

@Injectable({ providedIn: 'root' })
class BackendService {
  private templatesByCode: Record<string, string> = {};

  private _baseUrl = Environment.apiUrl
  private _http: HttpClient = inject(HttpClient);
  private _currentTemplateId: number | null = null;

  validateApiKey(apiKey: string): Observable<boolean> {
    return this._http.post<boolean>(`${this._baseUrl}/${Environment.authUIUrlPath}`, {"ApiKey": apiKey});
  }

  getTemplates(): Observable<TemplateOption[]> {
    const url = `${this._baseUrl}/${Environment.promptTemplates}`;

    return this._http.get<TemplateOption[]>(url).pipe(
      map((templates) => {
        const uniqueByCode = new Map<string, TemplateOption>();

        for (const template of templates) {
          const code = template.Code.trim();
          const name = template.Name.trim();

          if (!code || !name || uniqueByCode.has(code)) {
            continue;
          }

          uniqueByCode.set(code, { Code: code, Name: name });
        }

        const items = Array.from(uniqueByCode.values());

        // Keep the same lookup shape as before (code -> display name), but fill it from DB.
        this.templatesByCode = items.reduce<Record<string, string>>((acc, item) => {
          acc[item.Code] = item.Name;
          return acc;
        }, {});

        return items;
      })
    );
  }

  getPatientCards(): Observable<PatientCard[]> {
    const url = `${this._baseUrl}/${Environment.patientCardsUrlPath}`;
    return this._http.get<PatientCard[]>(url);
  }

  getTemplateByCode(templateCode: string): Observable<string> {
    const resolvedTemplateCode = this.resolveTemplateCode(templateCode);
    const url = `${this._baseUrl}/${Environment.promptTemplates}/resolve?code=${resolvedTemplateCode}`;
    this._currentTemplateId = null;

    return this._http.get<Template>(url).pipe(
      tap((template) => {
        this._currentTemplateId = template?.Id ?? null;
      }),
      map((template) => template?.Text ?? '')
    );
  }

  saveTemplate(payload: UpsertTemplateModel): Observable<boolean> {
    const code = this.resolveTemplateCode(payload.Code ?? '');
    const text = payload.Text ?? '';
    const url = `${this._baseUrl}/${Environment.promptTemplates}/text`;

    const body: UpsertTemplateModel = {
      Code: code,
      Text: text
    };

    return this._http.patch<Template>(url, body).pipe(
      tap((template) => {
        this._currentTemplateId = template?.Id ?? null;
      }),
      map(() => true)
    );
  }

  deleteTemplate(): Observable<boolean> {
    if (this._currentTemplateId == null) {
      return of(false);
    }

    const templateId = this._currentTemplateId;
    const url = `${this._baseUrl}/${Environment.promptTemplates}/${templateId}`;

    return this._http.delete<void>(url).pipe(
      tap(() => {
        this._currentTemplateId = null;
      }),
      map(() => true)
    );
  }

  askDialogQuestion(payload: AskDialogQuestionModel): Observable<string> {
    const url = `${this._baseUrl}/${Environment.enrichUrlPath}`;

    return this._http.post<LlmResponse>(url, payload).pipe(
      map(response => response.LlmResponse)
    );
  }

  private resolveTemplateCode(templateCode: string): string {
    const trimmed = templateCode.trim();

    // If caller already passed a known code.
    if (this.templatesByCode[trimmed]) {
      return trimmed;
    }

    const foundEntry = Object.entries(this.templatesByCode).find(([, displayName]) => displayName === trimmed);
    if (foundEntry) {
      return foundEntry[0];
    }

    // Fallback: build code-like key from free-form value.
    return trimmed.toLowerCase().replace(/\s+/g, '-');
  }
}

export default BackendService
