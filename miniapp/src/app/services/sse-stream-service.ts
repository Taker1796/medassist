import {inject, Injectable} from '@angular/core';
import {firstValueFrom, Observable} from 'rxjs';
import {AuthService} from './auth-service';
import {TgService} from './tg-service';

@Injectable({
  providedIn: 'root',
})
export class SseStreamService {
  private _authService = inject(AuthService);
  private _tgService = inject(TgService);

  postStream(url: string, body: unknown): Observable<string> {
    return new Observable<string>((observer) => {
      const abortController = new AbortController();

      const start = async () => {
        try {
          let response = await this.fetchStream(url, body, abortController.signal, false);

          if (response.status === 401) {
            response = await this.fetchStream(url, body, abortController.signal, true);
          }

          if (!response.ok) {
            throw new Error(`SSE request failed with status ${response.status}`);
          }

          if (!response.body) {
            throw new Error('SSE response body is empty');
          }

          await this.readSseStream(response.body, observer, abortController.signal);
        } catch (err: unknown) {
          if (!abortController.signal.aborted) {
            observer.error(err);
          }
        }
      };

      void start();

      return () => {
        abortController.abort();
      };
    });
  }

  private async fetchStream(
    url: string,
    body: unknown,
    signal: AbortSignal,
    forceReAuth: boolean
  ): Promise<Response> {
    const isAuthorized = await this.ensureAuthToken(forceReAuth);
    if (!isAuthorized) {
      throw new Error('Authentication failed');
    }

    const token = this._authService.GetToken;
    if (!token) {
      throw new Error('Token is missing');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${token}`
    };

    if (this._tgService.id) {
      headers['X-Telegram-User-Id'] = this._tgService.id.toString();
    }

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal
    });
  }

  private async ensureAuthToken(forceReAuth: boolean): Promise<boolean> {
    if (forceReAuth || !this._authService.GetToken) {
      return firstValueFrom(this._authService.Authenticate());
    }

    return true;
  }

  private async readSseStream(
    stream: ReadableStream<Uint8Array>,
    observer: { next: (value: string) => void; complete: () => void },
    signal: AbortSignal
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!signal.aborted) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, {stream: true});
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        if (this.isDoneEvent(part)) {
          observer.complete();
          await reader.cancel();
          return;
        }

        const chunks = this.extractChunksFromSsePart(part);
        for (const chunk of chunks) {
          observer.next(chunk);
        }
      }
    }

    if (buffer.trim()) {
      if (this.isDoneEvent(buffer)) {
        observer.complete();
        return;
      }

      const chunks = this.extractChunksFromSsePart(buffer);
      for (const chunk of chunks) {
        observer.next(chunk);
      }
    }

    observer.complete();
  }

  private extractChunksFromSsePart(part: string): string[] {
    if (!part.trim()) {
      return [];
    }

    const lines = part.split(/\r?\n/);
    const dataLines = lines
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith('data:'))
      .map((line: string) => line.slice(5).trim());

    if (dataLines.length === 0) {
      return [];
    }

    const rawData = dataLines.join('\n');
    if (!rawData || rawData === '[DONE]') {
      return [];
    }

    return this.parseSseData(rawData);
  }

  private parseSseData(data: string): string[] {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'string') {
        return parsed ? [parsed] : [];
      }

      if (Array.isArray(parsed)) {
        return parsed
          .filter((item: unknown) => typeof item === 'string' && item.length > 0)
          .map((item: unknown) => item as string);
      }

      if (parsed && typeof parsed === 'object') {
        const object = parsed as Record<string, unknown>;
        const chunkCandidate =
          object['contentDelta']
          ?? object['chunk']
          ?? object['content']
          ?? object['delta']
          ?? object['text']
          ?? object['answer']
          ?? object['token'];

        if (typeof chunkCandidate === 'string' && chunkCandidate.length > 0) {
          return [chunkCandidate];
        }

        return [];
      }
    } catch {
      // Ignore parse errors and fallback to raw text
    }

    return data ? [data] : [];
  }

  private isDoneEvent(part: string): boolean {
    return part
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .some((line: string) => line === 'data: [DONE]' || line === '[DONE]');
  }
}
