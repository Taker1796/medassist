import { Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import BackendService from '../../core/backend.service';
import {TemplateOption} from '../../models/template-option.model';
import {PatientCard} from '../../models/patient-card.model';
import {AskDialogQuestionMessage, AskDialogQuestionModel} from '../../models/ask-dialog-question.model';

type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
};
type GridSortField = 'Id' | 'PatientId' | 'SpecialtyCode';
type GridColumnField = 'Id' | 'PatientId' | 'SpecialtyCode' | 'History' | 'Summary';

@Component({
  selector: 'app-templates-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './templates-page.component.html',
  styleUrl: './templates-page.component.scss'
})
export class TemplatesPageComponent implements OnDestroy {
  private readonly backend = inject(BackendService);

  @ViewChild('chatHistory')
  private chatHistoryRef?: ElementRef<HTMLDivElement>;

  readonly defaultOption = '';

  templates = signal<TemplateOption[]>([]);
  selectedTemplate = signal(this.defaultOption);
  templateText = signal('');
  patientCardRows = signal<PatientCard[]>([]);
  selectedPatientId = signal<string>('');
  searchTemplateId = signal('');

  isLoadingTemplates = signal(true);
  isLoadingTemplate = signal(false);
  isLoadingGrid = signal(false);
  status = signal('');
  statusIsError = signal(false);

  questionText = signal('');
  isSendingQuestion = signal(false);
  chatMessages = signal<ChatMessage[]>([]);
  readonly columnWidths = signal<Record<GridColumnField, number>>({
    Id: 90,
    PatientId: 140,
    SpecialtyCode: 220,
    History: 520,
    Summary: 520
  });
  readonly gridSort = signal<{ field: GridSortField; direction: 'asc' | 'desc' }>({
    field: 'PatientId',
    direction: 'asc'
  });
  private activeResize: { column: GridColumnField; startX: number; startWidth: number } | null = null;

  filteredTemplateRows = computed(() => {
    const query = this.searchTemplateId().trim();
    const rows = !query
      ? this.patientCardRows()
      : this.patientCardRows().filter((row) => String(row.PatientId).includes(query));
    const { field, direction } = this.gridSort();
    const sortedRows = [...rows].sort((a, b) => this.compareRows(a, b, field));
    return direction === 'asc' ? sortedRows : sortedRows.reverse();
  });

  constructor() {
    this.backend.getTemplates().subscribe((items) => {
      this.templates.set(items);
      this.isLoadingTemplates.set(false);
    });

    this.loadTemplateForSelection(this.defaultOption);
    this.loadGridRows();
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

    const templateName = this.templates().find((item) => item.Code === payload.Code)?.Name ?? 'По умолчанию';
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

  onSearchTemplateId(value: string): void {
    this.searchTemplateId.set(value);
  }

  refreshGridRows(): void {
    this.loadGridRows();
  }

  selectPatientCard(row: PatientCard): void {
    this.selectedPatientId.set(String(row.PatientId));
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onResizeMouseMove);
    document.removeEventListener('mouseup', this.onResizeMouseUp);
  }

  toggleGridSort(field: GridSortField): void {
    const current = this.gridSort();
    if (current.field === field) {
      this.gridSort.set({
        field,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      });
      return;
    }

    this.gridSort.set({ field, direction: 'asc' });
  }

  getSortMark(field: GridSortField): string {
    const current = this.gridSort();
    if (current.field !== field) {
      return '';
    }

    return current.direction === 'asc' ? '▲' : '▼';
  }

  startResizeColumn(column: GridColumnField, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const startWidth = this.columnWidths()[column];
    this.activeResize = { column, startX: event.clientX, startWidth };
    document.addEventListener('mousemove', this.onResizeMouseMove);
    document.addEventListener('mouseup', this.onResizeMouseUp);
  }

  sendQuestion(): void {
    const question = this.questionText().trim();
    if (!question || this.isSendingQuestion()) {
      return;
    }

    const selectedPatientId = this.selectedPatientId().trim();
    const selectedTemplateCode = this.selectedTemplate().trim();

    const payload: AskDialogQuestionModel = {
      PatientId: selectedPatientId,
      DoctorSpecializationCode: selectedTemplateCode,
      Messages: this.buildDialogMessages(question)
    };

    this.chatMessages.update((messages) => [...messages, { role: 'user', text: question }]);
    this.questionText.set('');
    this.isSendingQuestion.set(true);
    this.scrollChatToBottom();

    this.backend
      .askDialogQuestion(payload)
      .subscribe({
        next: (answer) => {
          this.chatMessages.update((messages) => [...messages, { role: 'assistant', text: answer }]);
          this.isSendingQuestion.set(false);
          this.scrollChatToBottom();
        },
        error: () => {
          this.isSendingQuestion.set(false);
          this.statusIsError.set(true);
          this.status.set('Не удалось получить ответ');
        }
      });
  }

  isSelectedPatientRow(row: PatientCard): boolean {
    return String(row.PatientId) === this.selectedPatientId();
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

  private loadGridRows(): void {
    this.isLoadingGrid.set(true);
    this.backend
      .getPatientCards()
      .pipe(finalize(() => this.isLoadingGrid.set(false)))
      .subscribe({
        next: (rows: PatientCard[]) => this.patientCardRows.set(rows),
        error: () => this.patientCardRows.set([])
      });
  }

  private compareRows(a: PatientCard, b: PatientCard, field: GridSortField): number {
    switch (field) {
      case 'Id':
        return a.Id - b.Id;
      case 'PatientId':
        return a.PatientId - b.PatientId;
      case 'SpecialtyCode':
        return a.SpecialtyCode.localeCompare(b.SpecialtyCode, 'ru');
      default:
        return 0;
    }
  }

  private buildDialogMessages(currentQuestion: string): AskDialogQuestionMessage[] {
    const historyMessages: AskDialogQuestionMessage[] = this.chatMessages().map((message) => ({
      Role: message.role,
      Content: message.text
    }));

    return [
      ...historyMessages,
      {
        Role: 'user',
        Content: currentQuestion
      }
    ];
  }

  private onResizeMouseMove = (event: MouseEvent): void => {
    if (!this.activeResize) {
      return;
    }

    const deltaX = event.clientX - this.activeResize.startX;
    const nextWidth = Math.max(80, this.activeResize.startWidth + deltaX);
    this.columnWidths.update((current) => ({
      ...current,
      [this.activeResize!.column]: nextWidth
    }));
  };

  private onResizeMouseUp = (): void => {
    this.activeResize = null;
    document.removeEventListener('mousemove', this.onResizeMouseMove);
    document.removeEventListener('mouseup', this.onResizeMouseUp);
  };
}
