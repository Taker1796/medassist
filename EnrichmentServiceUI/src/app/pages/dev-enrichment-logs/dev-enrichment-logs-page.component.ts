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
  selectedLogIndex = signal<number>(-1);
  isLoading = signal(false);
  isClearing = signal(false);
  status = signal('');
  statusIsError = signal(false);

  selectedLog = computed(() => {
    const index = this.selectedLogIndex();
    const items = this.logs();
    if (index < 0 || index >= items.length) {
      return null;
    }

    return items[index] ?? null;
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
          const previousSelectedId = this.selectedLog()?.Id ?? '';
          this.logs.set(items);
          const nextIndex = previousSelectedId
            ? items.findIndex((item) => item.Id === previousSelectedId)
            : -1;

          this.selectedLogIndex.set(nextIndex >= 0 ? nextIndex : (items.length ? 0 : -1));
          this.status.set(items.length ? '' : 'Логи пока не записаны.');
          this.statusIsError.set(false);
        },
        error: () => {
          this.logs.set([]);
          this.selectedLogIndex.set(-1);
          this.status.set('Не удалось загрузить логи.');
          this.statusIsError.set(true);
        }
      });
  }

  selectLog(index: number): void {
    this.selectedLogIndex.set(index);
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
          this.selectedLogIndex.set(-1);
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
