import {inject, Injectable} from '@angular/core';
import {Observable, of, map, tap} from 'rxjs';
import {Environment} from '../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Template} from '../models/template.model';
import {UpsertTemplateModel} from '../models/upsertTemplate.model';
import {Specialization} from '../models/specialization.model';
import {LlmResponse} from '../models/llmResponse.model';

@Injectable({ providedIn: 'root' })
class BackendService {
  private specializations: Record<string, string> = {};

  private _baseUrl = Environment.apiUrl
  private _http: HttpClient = inject(HttpClient);
  private _currentTemplateId: number | null = null;
  private _currentSpecialtyCode: string | null = null;

  validateApiKey(apiKey: string): Observable<boolean> {
    return this._http.post<boolean>(`${this._baseUrl}/${Environment.authUIUrlPath}`, {"ApiKey": apiKey});
  }

  getSpecializations(): Observable<Specialization[]> {
    const url = `${this._baseUrl}/${Environment.promptTemplates}`;

    return this._http.get<Template[]>(url).pipe(
      map((templates) => {
        const uniqueByCode = new Map<string, Specialization>();

        for (const template of templates) {
          const code = template.SpecialtyCode?.trim();
          const name = template.SpecialtyName?.trim();

          if (!code || !name || uniqueByCode.has(code)) {
            continue;
          }

          uniqueByCode.set(code, { code, name });
        }

        const items = Array.from(uniqueByCode.values());

        // Keep the same lookup shape as before (code -> display name), but fill it from DB.
        this.specializations = items.reduce<Record<string, string>>((acc, item) => {
          acc[item.code] = item.name;
          return acc;
        }, {});

        return items;
      })
    );
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
    const url = `${this._baseUrl}/${Environment.promptTemplates}/text`;

    let body: UpsertTemplateModel = {
      TemplateId: this._currentSpecialtyCode === specialtyCode ? this._currentTemplateId : null,
      SpecialtyCode: specialtyCode,
      TemplateText: _template,
      IsDefault: isDefault
    };

    return this._http.patch<Template>(url, body).pipe(
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
