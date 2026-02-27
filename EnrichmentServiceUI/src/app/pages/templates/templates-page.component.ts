import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockBackendService } from '../../core/mock-backend.service';

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
  private readonly backend = inject(MockBackendService);

  @ViewChild('chatHistory')
  private chatHistoryRef?: ElementRef<HTMLDivElement>;

  readonly defaultOption = '';

  specializations = signal<string[]>([]);
  selectedSpecialization = signal(this.defaultOption);
  templateText = signal('');

  isLoadingSpecializations = signal(true);
  isLoadingTemplate = signal(false);
  status = signal('');

  questionText = signal('');
  isSendingQuestion = signal(false);
  chatMessages = signal<ChatMessage[]>([]);

  constructor() {
    this.backend.getSpecializations().subscribe((items) => {
      this.specializations.set(items);
      this.isLoadingSpecializations.set(false);
    });
  }

  onSpecializationChange(value: string): void {
    this.selectedSpecialization.set(value);
    this.status.set('');

    if (!value) {
      this.templateText.set('');
      return;
    }

    this.isLoadingTemplate.set(true);
    this.backend.getTemplateBySpecialization(value).subscribe((template) => {
      this.templateText.set(template);
      this.isLoadingTemplate.set(false);
    });
  }

  onTemplateInput(value: string): void {
    this.templateText.set(value);
  }

  clearTemplate(): void {
    this.templateText.set('');
    this.status.set('Шаблон очищен');
  }

  saveTemplate(): void {
    const specialization = this.selectedSpecialization();
    if (!specialization) {
      this.status.set('Сначала выберите специализацию');
      return;
    }

    this.backend.saveTemplate(specialization, this.templateText()).subscribe(() => {
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
