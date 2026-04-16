import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import BackendService from '../../core/backend.service';
import { DevEnrichmentLogEntry } from '../../models/dev-enrichment-log.model';

@Component({
  selector: 'app-dev-enrichment-logs-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dev-enrichment-logs-page.component.html',
  styleUrl: './dev-enrichment-logs-page.component.scss'
})
export class DevEnrichmentLogsPageComponent {
  private readonly backend = inject(BackendService);

  logs = signal<DevEnrichmentLogEntry[]>([]);
  selectedLogId = signal<string>('');
  isLoading = signal(false);
  isClearing = signal(false);
  status = signal('');
  statusIsError = signal(false);

  selectedLog = computed(() => {
    const selectedId = this.selectedLogId();
    return this.logs().find((item) => item.Id === selectedId) ?? null;
  });

  incomingRequestJson = computed(() => this.formatJson(this.selectedLog()?.IncomingRequest));
  outgoingRequestJson = computed(() => this.formatJson(this.selectedLog()?.OutgoingLlmRequest));

  constructor() {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.backend
      .getDevEnrichmentLogs()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (items) => {
          this.logs.set(items);
          const firstId = items[0]?.Id ?? '';
          this.selectedLogId.set(items.some((item) => item.Id === this.selectedLogId()) ? this.selectedLogId() : firstId);
          this.status.set(items.length ? '' : 'Логи пока не записаны.');
          this.statusIsError.set(false);
        },
        error: () => {
          this.logs.set([]);
          this.selectedLogId.set('');
          this.status.set('Не удалось загрузить логи.');
          this.statusIsError.set(true);
        }
      });
  }

  selectLog(logId: string): void {
    this.selectedLogId.set(logId);
  }

  clearLogs(): void {
    if (!confirm('Очистить все dev-логи обогащения?')) {
      return;
    }

    this.isClearing.set(true);
    this.backend
      .clearDevEnrichmentLogs()
      .pipe(finalize(() => this.isClearing.set(false)))
      .subscribe({
        next: () => {
          this.logs.set([]);
          this.selectedLogId.set('');
          this.status.set('Логи очищены.');
          this.statusIsError.set(false);
        },
        error: () => {
          this.status.set('Не удалось очистить логи.');
          this.statusIsError.set(true);
        }
      });
  }

  trackByLogId(_: number, item: DevEnrichmentLogEntry): string {
    return item.Id;
  }

  private formatJson(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2);
  }
}
