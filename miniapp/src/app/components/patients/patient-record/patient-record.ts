import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Router} from '@angular/router';
import {PatientsService} from '../../../services/patients-service';
import {PatientResponse} from '../../../models/patientResponse.model';
import {MenuShell} from '../../menu-shell/menu-shell';
import {DatePipe} from '@angular/common';
import {catchError, finalize, forkJoin, of} from 'rxjs';
import {firstValueFrom} from 'rxjs';
import {PatientChatCurrentResponse} from '../../../models/patientChatCurrentResponse.model';
import {PatientChatTurn} from '../../../models/patientChatTurn.model';
import {PatientChatConversationHistory} from '../../../models/patientChatConversationHistory.model';
import {FormsModule} from '@angular/forms';
import {PatientChatStatus} from '../../../models/patientChatStatus.model';
import {ToastService} from '../../../services/toast.service';

@Component({
  selector: 'app-patient-record',
  imports: [
    MenuShell,
    FormsModule
  ],
  templateUrl: './patient-record.html',
  styleUrl: './patient-record.css'
})
export class PatientRecord implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _patientsService = inject(PatientsService);
  private _cdr = inject(ChangeDetectorRef);
  private _toast = inject(ToastService);

  patient: PatientResponse | null = null;
  conversations: PatientChatConversationHistory[] = [];
  searchQuery = '';
  patientId: string | null = null;
  hasActiveConversation = false;
  hasConversationsApi = true;
  isLoadingConversationStatus = false;
  isStartingVisit = false;
  isCompletingVisit = false;
  isRefreshingPage = false;
  lastRefreshedAt: Date | null = null;

  ngOnInit(): void {
    const statePatientId = this._router.currentNavigation()?.extras.state?.['patientId'];
    const queryPatientId = this._route.snapshot.queryParamMap.get('patientId');
    this.patientId = statePatientId ?? history.state?.['patientId'] ?? queryPatientId ?? null;

    if (!this.patientId) {
      this._router.navigate(['/app/patients']);
      return;
    }

    this.refreshPageData();
  }

  startVisit(): void {
    if (!this.patientId || this.isStartingVisit) return;

    this.isStartingVisit = true;
    if (this.hasActiveConversation) {
      this.continueActiveVisit();
      return;
    }

    const finalizingVisitsCount = this.getFinalizingVisitsCount();
    if (finalizingVisitsCount > 0) {
      const noun = finalizingVisitsCount === 1 ? 'приём' : 'приёмы';
      const confirmMessage =
        `У пациента есть ${finalizingVisitsCount} ${noun}, по которым итоги ещё рассчитываются.\n` +
        'Если начать новый приём сейчас, эти результаты не будут учтены в новом диалоге.\n\n' +
        'Продолжить?';

      const isConfirmed = window.confirm(confirmMessage);
      if (!isConfirmed) {
        this.isStartingVisit = false;
        this._cdr.detectChanges();
        return;
      }
    }

    this._patientsService.createChatConversation(this.patientId).pipe(
      catchError((err: unknown) => {
        this._toast.error('Не удалось открыть приём. Попробуйте ещё раз.');
        console.log(err);
        return of(null);
      })
    ).subscribe((response) => {
      this.isStartingVisit = false;
      if (!response) {
        return;
      }

      this.hasActiveConversation = true;
      this._patientsService.setCurrentConversationTurns(this.patientId!, []);
      this.openConsultation();
    });
  }

  openEditPatient(): void {
    if (!this.patientId) return;
    this._router.navigate(['/app/upsert-patient'], {state: {mode: 'update', patientId: this.patientId}});
  }

  async completeVisit(): Promise<void> {
    if (!this.patientId || this.isCompletingVisit) return;

    this.isCompletingVisit = true;
    this._cdr.detectChanges();
    try {
      await firstValueFrom(this._patientsService.completeCurrentConversation(this.patientId));
      const status = await firstValueFrom(this.refreshConversationStatus());
      this.hasActiveConversation = !!status.hasActiveConversation;
      this.loadConversations();
      this._cdr.detectChanges();
    } catch (err: unknown) {
      this._toast.error('Не удалось завершить приём. Попробуйте ещё раз.');
      console.log(err);
    } finally {
      this.isCompletingVisit = false;
      this._cdr.detectChanges();
    }
  }

  getSexLabel(sex: number | null | undefined): string {
    if (sex === 0) {
      return 'Женский';
    }

    if (sex === 1) {
      return 'Мужской';
    }

    return '—';
  }

  get filteredConversations(): PatientChatConversationHistory[] {
    const normalizedQuery = this.searchQuery.trim().toLocaleLowerCase('ru-RU');
    if (!normalizedQuery) {
      return this.conversations;
    }

    return this.conversations.filter((conversation: PatientChatConversationHistory) =>
      this.formatConversationDate(conversation.createdAt).toLocaleLowerCase('ru-RU').includes(normalizedQuery)
    );
  }

  formatConversationDate(value: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Без даты';
    }

    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openConversationSummary(conversationId: string): void {
    if (!this.patientId || !conversationId) return;
    const conversation = this.conversations.find((item: PatientChatConversationHistory) => item.conversationId === conversationId);
    const status = this.resolveConversationStatus(conversation);

    if (status === PatientChatStatus.Active || status === PatientChatStatus.New) {
      this.isStartingVisit = true;
      this.continueActiveVisit();
      return;
    }

    this._router.navigate(['/app/patient-visit-summary'], {
      queryParams: {
        patientId: this.patientId,
        conversationId,
        status
      },
      state: {
        patientId: this.patientId,
        conversationId,
        status
      }
    });
  }

  getConversationStatusLabel(conversation: PatientChatConversationHistory): string {
    const status = this.resolveConversationStatus(conversation);

    if (status === PatientChatStatus.Completed) {
      return 'Завершен';
    }

    if (status === PatientChatStatus.Finalizing) {
      return 'Рассчитывается';
    }

    if (status === PatientChatStatus.Failed) {
      return 'Ошибка';
    }

    return 'Активный';
  }

  refreshPageData(): void {
    if (!this.patientId || this.isRefreshingPage) {
      return;
    }

    this.isRefreshingPage = true;
    this.hasConversationsApi = true;

    forkJoin({
      patient: this._patientsService.getById(this.patientId).pipe(
        catchError((err: unknown) => {
          console.log(err);
          return of<PatientResponse | null>(null);
        })
      ),
      currentConversation: this.refreshConversationStatus(true),
      conversations: this._patientsService.getChatConversations(this.patientId).pipe(
        catchError((err: unknown) => {
          console.log(err);
          this.hasConversationsApi = false;
          return of<PatientChatConversationHistory[]>([]);
        })
      )
    }).pipe(
      finalize(() => {
        this.isRefreshingPage = false;
        this._cdr.detectChanges();
      })
    ).subscribe(({patient, currentConversation, conversations}: {
      patient: PatientResponse | null;
      currentConversation: PatientChatCurrentResponse;
      conversations: PatientChatConversationHistory[];
    }) => {
      if (patient) {
        this.patient = patient;
      }

      this.hasActiveConversation = !!currentConversation.hasActiveConversation;
      this.conversations = [...conversations].sort((a: PatientChatConversationHistory, b: PatientChatConversationHistory) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.lastRefreshedAt = new Date();
      this._cdr.detectChanges();
    });
  }

  private continueActiveVisit(): void {
    if (!this.patientId) {
      this.isStartingVisit = false;
      return;
    }

    this._patientsService.getCurrentConversationTurns(this.patientId, true).pipe(
      catchError((err: unknown) => {
        this._toast.error('Не удалось открыть приём. Попробуйте ещё раз.');
        console.log(err);
        return of<PatientChatTurn[] | null>(null);
      })
    ).subscribe((turns: PatientChatTurn[] | null) => {
      this.isStartingVisit = false;
      if (!turns) {
        return;
      }

      this.hasActiveConversation = true;
      this._patientsService.setCurrentConversationTurns(this.patientId!, turns);
      this.openConsultation();
    });
  }

  private openConsultation(): void {
    this._router.navigate(['/app/consultation'], {
      queryParams: {patientId: this.patientId},
      state: {
        patientId: this.patientId,
        patientNickname: this.patient?.nickname ?? null
      }
    });
  }

  private loadConversations(): void {
    if (!this.patientId) return;

    this._patientsService.getChatConversations(this.patientId).pipe(
      catchError(() => {
        this.hasConversationsApi = false;
        return of([]);
      })
    ).subscribe((conversations: PatientChatConversationHistory[]) => {
      this.conversations = [...conversations].sort((a: PatientChatConversationHistory, b: PatientChatConversationHistory) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this._cdr.detectChanges();
    });
  }

  private refreshConversationStatus(showLoader = false) {
    if (!this.patientId) {
      return of<PatientChatCurrentResponse>({hasActiveConversation: false});
    }

    if (showLoader) {
      this.isLoadingConversationStatus = true;
    }

    return this._patientsService.getCurrentConversationStatus(this.patientId).pipe(
      catchError(() => of<PatientChatCurrentResponse>({hasActiveConversation: false})),
      finalize(() => {
        if (showLoader) {
          this.isLoadingConversationStatus = false;
          this._cdr.detectChanges();
        }
      })
    );
  }

  private resolveConversationStatus(conversation: PatientChatConversationHistory | undefined): number {
    if (!conversation) {
      return PatientChatStatus.Active;
    }

    if (typeof conversation.status === 'number') {
      return conversation.status;
    }

    return conversation.isCompleted ? PatientChatStatus.Completed : PatientChatStatus.Active;
  }

  private getFinalizingVisitsCount(): number {
    return this.conversations.filter((conversation: PatientChatConversationHistory) =>
      this.resolveConversationStatus(conversation) === PatientChatStatus.Finalizing
    ).length;
  }

}
