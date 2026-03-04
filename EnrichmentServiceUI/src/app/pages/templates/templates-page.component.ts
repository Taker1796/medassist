import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import BackendService from '../../core/backend.service';
import {TemplateOption} from '../../models/template-option.model';

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

  templates = signal<TemplateOption[]>([]);
  selectedTemplate = signal(this.defaultOption);
  templateText = signal('');

  isLoadingTemplates = signal(true);
  isLoadingTemplate = signal(false);
  status = signal('');
  statusIsError = signal(false);

  questionText = signal('');
  isSendingQuestion = signal(false);
  chatMessages = signal<ChatMessage[]>([]);

  constructor() {
    this.backend.getTemplates().subscribe((items) => {
      this.templates.set(items);
      this.isLoadingTemplates.set(false);
    });

    this.loadTemplateForSelection(this.defaultOption);
  }

  onTemplateChange(value: string): void {
    this.selectedTemplate.set(value);
    this.status.set('');
    this.statusIsError.set(false);
    this.chatMessages.set([]);
    this.questionText.set('');
    this.loadTemplateForSelection(value);
  }

  private loadTemplateForSelection(templateCode: string): void {
    this.isLoadingTemplate.set(true);
    this.backend
      .getTemplateByCode(templateCode)
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
    const payload = {
      Code: this.selectedTemplate().trim(),
      Text: this.templateText()
    };

    if (!payload.Code) {
      this.statusIsError.set(true);
      this.status.set('Выберите шаблон');
      return;
    }

    const templateName = this.templates().find((item) => item.Code === payload.Code)?.Name ?? 'Не выбрана';
    if(!confirm('Сохранить шаблон "' + templateName + '"?')){
      return;
    }

    this.backend.saveTemplate(payload).subscribe(() => {
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
      .askDialogQuestion(question, this.selectedTemplate())
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
