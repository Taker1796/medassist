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

  patient: PatientResponse | null = null;
  conversations: PatientChatConversationHistory[] = [];
  searchQuery = '';
  patientId: string | null = null;
  hasActiveConversation = false;
  hasConversationsApi = true;
  isLoadingConversationStatus = false;
  isStartingVisit = false;
  isCompletingVisit = false;

  ngOnInit(): void {
    const statePatientId = this._router.currentNavigation()?.extras.state?.['patientId'];
    const queryPatientId = this._route.snapshot.queryParamMap.get('patientId');
    this.patientId = statePatientId ?? history.state?.['patientId'] ?? queryPatientId ?? null;

    if (!this.patientId) {
      this._router.navigate(['/patients']);
      return;
    }

    this.loadData();
  }

  startVisit(): void {
    if (!this.patientId || this.isStartingVisit) return;

    this.isStartingVisit = true;
    if (this.hasActiveConversation) {
      this._patientsService.getCurrentConversationTurns(this.patientId, true).pipe(
        catchError((err: unknown) => {
          alert('Не удалось открыть приём. Попробуйте еще раз.');
          console.log(err);
          return of(null);
        })
      ).subscribe((turns: PatientChatTurn[] | null) => {
        this.isStartingVisit = false;
        if (!turns) {
          return;
        }
        this.openConsultation();
      });
      return;
    }

    this._patientsService.createChatConversation(this.patientId).pipe(
      catchError((err: unknown) => {
        alert('Не удалось открыть приём. Попробуйте еще раз.');
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
    this._router.navigate(['/upsert-patient'], {state: {mode: 'update', patientId: this.patientId}});
  }

  async completeVisit(): Promise<void> {
    if (!this.patientId || this.isCompletingVisit) return;

    this.isCompletingVisit = true;
    this._cdr.detectChanges();
    try {
      await firstValueFrom(this._patientsService.completeCurrentConversation(this.patientId));
      const status = await firstValueFrom(this.refreshConversationStatus());
      this.hasActiveConversation = status.hasActiveConversation;
      this.loadConversations();
      this._cdr.detectChanges();
    } catch (err: unknown) {
      alert('Не удалось завершить приём. Попробуйте еще раз.');
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

    this._router.navigate(['/patient-visit-summary'], {
      queryParams: {
        patientId: this.patientId,
        conversationId
      },
      state: {
        patientId: this.patientId,
        conversationId
      }
    });
  }

  private openConsultation(): void {
    this._router.navigate(['/consultation'], {
      queryParams: {patientId: this.patientId},
      state: {
        patientId: this.patientId,
        patientNickname: this.patient?.nickname ?? null
      }
    });
  }

  private loadData(): void {
    if (!this.patientId) return;

    forkJoin({
      patient: this._patientsService.getById(this.patientId),
      currentConversation: this.refreshConversationStatus(true)
    }).subscribe(({patient, currentConversation}: {patient: PatientResponse; currentConversation: PatientChatCurrentResponse}) => {
      this.patient = patient;
      this.hasActiveConversation = currentConversation.hasActiveConversation;
      this._cdr.detectChanges();
    });

    this.loadConversations();
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

}
