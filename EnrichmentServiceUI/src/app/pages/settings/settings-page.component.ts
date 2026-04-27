import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import BackendService from '../../core/backend.service';
import { LlmConfigurationUpdateRequest } from '../../models/llm-configuration.model';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent {
  private readonly backend = inject(BackendService);

  endpoint = signal('');
  apiKeyHeader = signal('');
  apiKey = signal('');

  isLoading = signal(true);
  isSaving = signal(false);
  status = signal('');
  statusIsError = signal(false);

  constructor() {
    this.loadConfiguration();
  }

  onEndpointInput(value: string): void {
    this.endpoint.set(value);
  }

  onApiKeyHeaderInput(value: string): void {
    this.apiKeyHeader.set(value);
  }

  onApiKeyInput(value: string): void {
    this.apiKey.set(value);
  }

  save(): void {
    const payload: LlmConfigurationUpdateRequest = {
      Endpoint: this.endpoint().trim(),
      ApiKeyHeader: this.apiKeyHeader().trim(),
      ApiKey: this.apiKey().trim()
    };

    if (!payload.Endpoint) {
      this.status.set('Endpoint обязателен.');
      this.statusIsError.set(true);
      return;
    }

    this.isSaving.set(true);
    this.backend
      .updateLlmConfiguration(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (config) => {
          this.endpoint.set(config.Endpoint);
          this.apiKeyHeader.set(config.ApiKeyHeader);
          this.apiKey.set(config.ApiKey);
          this.status.set('Настройки сохранены.');
          this.statusIsError.set(false);
        },
        error: () => {
          this.status.set('Не удалось сохранить настройки.');
          this.statusIsError.set(true);
        }
      });
  }

  private loadConfiguration(): void {
    this.isLoading.set(true);
    this.backend
      .getLlmConfiguration()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (config) => {
          this.endpoint.set(config.Endpoint);
          this.apiKeyHeader.set(config.ApiKeyHeader);
          this.apiKey.set(config.ApiKey);
          this.status.set('');
          this.statusIsError.set(false);
        },
        error: () => {
          this.status.set('Не удалось загрузить настройки.');
          this.statusIsError.set(true);
        }
      });
  }
}
