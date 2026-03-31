import {inject, Injectable, NgZone} from '@angular/core';
import {Observable, of, map, tap} from 'rxjs';
import {Environment} from '../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Template} from '../models/template.model';
import {UpsertTemplateModel} from '../models/upsertTemplate.model';
import {TemplateOption} from '../models/template-option.model';
import {PatientCard} from '../models/patient-card.model';
import {AskDialogQuestionModel} from '../models/ask-dialog-question.model';

@Injectable({ providedIn: 'root' })
class BackendService {
  private templatesByCode: Record<string, string> = {};

  private _baseUrl = Environment.apiUrl
  private _http: HttpClient = inject(HttpClient);
  private _ngZone: NgZone = inject(NgZone);
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

  askDialogQuestionStream(payload: AskDialogQuestionModel): Observable<string> {
    const url = `${this._baseUrl}/${Environment.enrichStreamUrlPath}`;
    const apiKey = localStorage.getItem('enrichment-api-key');

    return new Observable<string>((subscriber) => {
      const abortController = new AbortController();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      if (url.includes('.ngrok-free.dev')) {
        headers['ngrok-skip-browser-warning'] = 'true';
      }

      void fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: abortController.signal
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          if (!response.body) {
            subscriber.complete();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const parsed = this.consumeSseEvents(buffer);
            buffer = parsed.remainder;

            for (const event of parsed.events) {
              if (event === '[DONE]') {
                this._ngZone.run(() => subscriber.complete());
                return;
              }

              const text = this.extractTextFromSseData(event);
              if (text) {
                this._ngZone.run(() => subscriber.next(text));
              }
            }
          }

          const tail = decoder.decode();
          if (tail) {
            buffer += tail;
          }

          const lastEventText = this.extractTextFromSseData(buffer.trim());
          if (lastEventText) {
            this._ngZone.run(() => subscriber.next(lastEventText));
          }

          this._ngZone.run(() => subscriber.complete());
        })
        .catch((error: unknown) => {
          if (abortController.signal.aborted) {
            this._ngZone.run(() => subscriber.complete());
            return;
          }

          this._ngZone.run(() => subscriber.error(error));
        });

      return () => {
        abortController.abort();
      };
    });
  }

  private consumeSseEvents(buffer: string): { events: string[]; remainder: string } {
    const events: string[] = [];
    let remainder = buffer;

    while (true) {
      const nextLfLf = remainder.indexOf('\n\n');
      const nextCrLfCrLf = remainder.indexOf('\r\n\r\n');
      const separatorIndex = this.resolveSeparatorIndex(nextLfLf, nextCrLfCrLf);

      if (separatorIndex < 0) {
        break;
      }

      const separatorLength = separatorIndex === nextCrLfCrLf ? 4 : 2;
      const rawEvent = remainder.slice(0, separatorIndex);
      remainder = remainder.slice(separatorIndex + separatorLength);

      const lines = rawEvent.split(/\r?\n/);
      const dataLines = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart());

      if (dataLines.length) {
        events.push(dataLines.join('\n'));
      }
    }

    return { events, remainder };
  }

  private resolveSeparatorIndex(lfLfIndex: number, crLfCrLfIndex: number): number {
    if (lfLfIndex < 0) {
      return crLfCrLfIndex;
    }

    if (crLfCrLfIndex < 0) {
      return lfLfIndex;
    }

    return Math.min(lfLfIndex, crLfCrLfIndex);
  }

  private extractTextFromSseData(rawData: string): string {
    if (!rawData || rawData === '[DONE]') {
      return '';
    }

    const normalizedData = this.normalizeSseData(rawData);
    if (!normalizedData || normalizedData === '[DONE]') {
      return '';
    }

    try {
      const payload = JSON.parse(normalizedData);
      return this.extractTextFromPayload(payload);
    } catch {
      return '';
    }
  }

  private normalizeSseData(rawData: string): string {
    const trimmed = rawData.trim();
    if (!trimmed) {
      return '';
    }

    if (!trimmed.includes('data:')) {
      return trimmed;
    }

    const dataLines = trimmed
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart());

    return dataLines.join('\n').trim();
  }

  private extractTextFromPayload(payload: unknown): string {
    if (!payload) {
      return '';
    }

    if (typeof payload === 'string') {
      return payload;
    }

    if (Array.isArray(payload)) {
      return payload.map((item) => this.extractTextFromPayload(item)).join('');
    }

    if (typeof payload !== 'object') {
      return '';
    }

    const record = payload as Record<string, unknown>;
    const choiceDelta = this.extractTextFromPayload(record['choices']);
    if (choiceDelta) {
      return choiceDelta;
    }

    return [
      this.extractTextFromPayload(record['delta']),
      this.extractTextFromPayload(record['message']),
      this.extractTextFromPayload(record['content']),
      this.extractTextFromPayload(record['output_text']),
      this.extractTextFromPayload(record['text']),
      this.extractTextFromPayload(record['response'])
    ].join('');
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
