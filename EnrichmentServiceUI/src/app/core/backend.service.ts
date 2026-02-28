import {inject, Injectable} from '@angular/core';
import {Observable, delay, of, map, tap} from 'rxjs';
import {Environment} from '../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Template} from '../models/template.model';
import {UpsertTemplateModel} from '../models/upsertTemplate.model';
import {Specialization} from '../models/specialization.model';
import {LlmResponse} from '../models/llmResponse.model';

@Injectable({ providedIn: 'root' })
class BackendService {
  private readonly specializations: Record<string, string> = {
    cardiology: 'Кардиология',
    neurology: 'Неврология',
    pediatrics: 'Педиатрия',
    dermatology: 'Дерматология',
    therapy: 'Therapy / Internal medicine',
    psychiatry:'Психиатрия'
  };

  private _baseUrl = Environment.apiUrl
  private _http: HttpClient = inject(HttpClient);
  private _currentTemplateId: number | null = null;
  private _currentSpecialtyCode: string | null = null;

  validateApiKey(apiKey: string): Observable<boolean> {
    return this._http.post<boolean>(`${this._baseUrl}/${Environment.authUIUrlPath}`, {"ApiKey": apiKey});
  }

  getSpecializations(): Observable<Specialization[]> {
    const options = Object.entries(this.specializations).map(([code, name]) => ({ code, name }));
    return of(options).pipe(delay(350));
  }

  getTemplateBySpecialization(specialization: string): Observable<string> {
    const specializationKey = this.resolveSpecializationCode(specialization);
    const url = `${this._baseUrl}/${Environment.promptTemplates}/resolve?specialtyCode=${specializationKey}`;
    this._currentSpecialtyCode = specializationKey;
    this._currentTemplateId = null;

    return this._http.get<Template>(url).pipe(
      tap((template) => {
        this._currentTemplateId = template?.Id ?? null;
      }),
      map((template) => template?.TemplateText ?? '')
    );
  }

  saveTemplate(_specialization: string, _template: string): Observable<boolean> {
    const rawSpecialization = _specialization?.trim() ?? '';
    const isDefault = rawSpecialization.length === 0;
    const specialtyCode = isDefault ? '' : this.resolveSpecializationCode(rawSpecialization);
    const url = `${this._baseUrl}/${Environment.promptTemplates}/upsert`;

    let body: UpsertTemplateModel = {
      TemplateId: this._currentSpecialtyCode === specialtyCode ? this._currentTemplateId : null,
      SpecialtyCode: specialtyCode,
      TemplateText: _template,
      IsDefault: isDefault
    };

    return this._http.post<Template>(url, body).pipe(
      tap((template) => {
        this._currentTemplateId = template?.Id ?? null;
        this._currentSpecialtyCode = specialtyCode;
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

  askDialogQuestion(question: string, specialization: string): Observable<string> {
    const url = `${this._baseUrl}/${Environment.enrichUrlPath}`;

    return this._http.post<LlmResponse>(url, { Text: question, SpecialtyCode: specialization }).pipe(
      map(response => response.LlmResponse)
    );
  }

  private resolveSpecializationCode(specialization: string): string {
    const trimmed = specialization.trim();

    // If caller already passed a known code.
    if (this.specializations[trimmed]) {
      return trimmed;
    }

    const foundEntry = Object.entries(this.specializations).find(([, displayName]) => displayName === trimmed);
    if (foundEntry) {
      return foundEntry[0];
    }

    // Fallback: build code-like key from free-form value.
    return trimmed.toLowerCase().replace(/\s+/g, '-');
  }
}

export default BackendService
