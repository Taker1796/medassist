import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MockBackendService {
  private readonly templatesBySpecialization: Record<string, string> = {
    cardiology: 'Кардиология: шаблон описания для первичного приема.\n\nЖалобы:\nАнамнез:\nРекомендации:',
    neurology: 'Неврология: шаблон неврологического статуса.\n\nСознание:\nЧерепно-мозговые нервы:\nЛечение:',
    pediatrics: 'Педиатрия: шаблон осмотра ребенка.\n\nТемпература:\nОсмотр органов:\nНазначения:'
  };

  validateApiKey(apiKey: string): Observable<boolean> {
    const isValid = apiKey.trim() === 'valid-api-key';
    return of(isValid).pipe(delay(400));
  }

  getSpecializations(): Observable<string[]> {
    return of(Object.keys(this.templatesBySpecialization)).pipe(delay(350));
  }

  getTemplateBySpecialization(specialization: string): Observable<string> {
    return of(this.templatesBySpecialization[specialization] ?? '').pipe(delay(300));
  }

  saveTemplate(_specialization: string, _template: string): Observable<boolean> {
    return of(true).pipe(delay(250));
  }

  askDialogQuestion(question: string, specialization: string): Observable<string> {
    const response = specialization
      ? `Ответ (заглушка) по специализации '${specialization}': получен вопрос '${question}'.`
      : `Ответ (заглушка): получен вопрос '${question}'. Выберите специализацию для более точного ответа.`;

    return of(response).pipe(delay(500));
  }
}
