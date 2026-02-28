import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import BackendService from '../../core/backend.service';
import {Specialization} from '../../models/specialization.model';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};

@Component({
  selector: 'app-templates-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './templates-page.component.html',
  styleUrl: './templates-page.component.scss'
})
export class TemplatesPageComponent {
  private readonly backend = inject(BackendService);

  @ViewChild('chatHistory')
  private chatHistoryRef?: ElementRef<HTMLDivElement>;

  readonly defaultOption = '';

  specializations = signal<Specialization[]>([]);
  selectedSpecialization = signal(this.defaultOption);
  templateText = signal('');

  isLoadingSpecializations = signal(true);
  isLoadingTemplate = signal(false);
  status = signal('');
  statusIsError = signal(false);

  questionText = signal('');
  isSendingQuestion = signal(false);
  chatMessages = signal<ChatMessage[]>([]);

  constructor() {
    this.backend.getSpecializations().subscribe((items) => {
      this.specializations.set(items);
      this.isLoadingSpecializations.set(false);
    });

    this.loadTemplateForSelection(this.defaultOption);
  }

  onSpecializationChange(value: string): void {
    this.selectedSpecialization.set(value);
    this.status.set('');
    this.statusIsError.set(false);
    this.chatMessages.set([]);
    this.questionText.set('');
    this.loadTemplateForSelection(value);
  }

  private loadTemplateForSelection(specialization: string): void {
    this.isLoadingTemplate.set(true);
    this.backend
      .getTemplateBySpecialization(specialization)
      .pipe(finalize(() => this.isLoadingTemplate.set(false)))
      .subscribe({
        next: (template) => {
          this.templateText.set(template);
          this.statusIsError.set(false);
        },
        error: (error: unknown) => {
          this.templateText.set('');
          this.statusIsError.set(true);
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.status.set('Шаблон не найден');
            return;
          }

          this.status.set('Не удалось загрузить шаблон');
        }
      });
  }

  onTemplateInput(value: string): void {
    this.templateText.set(value);
  }

  clearTemplate(): void {
    this.backend.deleteTemplate().subscribe({
      next: (deleted) => {
        if (!deleted) {
          this.statusIsError.set(true);
          this.status.set('Шаблон не найден в базе для удаления');
          return;
        }

        this.templateText.set('');
        this.statusIsError.set(false);
        this.status.set('Шаблон удален');
      },
      error: () => {
        this.statusIsError.set(true);
        this.status.set('Не удалось удалить шаблон');
      }
    });
  }

  saveTemplate(): void {
    const specialization = this.selectedSpecialization();
    const specializationName = this.specializations().find((item) => item.code === specialization)?.name ?? 'Не выбрана';
    if(!confirm('Сохранить шаблон для специализации "'+specializationName +'"?')){
      return;
    }

    this.backend.saveTemplate(specialization, this.templateText()).subscribe(() => {
      this.statusIsError.set(false);
      this.status.set('Шаблон сохранен');
    });
  }

  onQuestionInput(value: string): void {
    this.questionText.set(value);
  }

  sendQuestion(): void {
    const question = this.questionText().trim();
    if (!question || this.isSendingQuestion()) {
      return;
    }

    this.chatMessages.update((messages) => [...messages, { role: 'user', text: question }]);
    this.questionText.set('');
    this.isSendingQuestion.set(true);
    this.scrollChatToBottom();

    this.backend
      .askDialogQuestion(question, this.selectedSpecialization())
      .subscribe((answer) => {
        this.chatMessages.update((messages) => [...messages, { role: 'assistant', text: answer }]);
        this.isSendingQuestion.set(false);
        this.scrollChatToBottom();
      });
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const chatElement = this.chatHistoryRef?.nativeElement;
      if (!chatElement) {
        return;
      }

      chatElement.scrollTop = chatElement.scrollHeight;
    }, 0);
  }
}
