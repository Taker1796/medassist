import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {catchError, of} from 'rxjs';
import {MenuShell} from '../../menu-shell/menu-shell';
import {PatientsService} from '../../../services/patients-service';
import {PatientChatConversationSummary} from '../../../models/patientChatConversationSummary.model';
import {DatePipe} from '@angular/common';
import {PatientChatConversationHistory} from '../../../models/patientChatConversationHistory.model';
import {PatientChatStatus} from '../../../models/patientChatStatus.model';

@Component({
  selector: 'app-patient-visit-summary',
  standalone: true,
  imports: [
    MenuShell,
    DatePipe
  ],
  templateUrl: './patient-visit-summary.html',
  styleUrl: './patient-visit-summary.css'
})
export class PatientVisitSummary implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _patientsService = inject(PatientsService);
  private _cdr = inject(ChangeDetectorRef);

  backRoute = '/patients';
  patientId: string | null = null;
  conversationId: string | null = null;
  isLoading = true;
  hasError = false;
  summaryData: PatientChatConversationSummary | null = null;
  conversationStatus: number | null = null;
  statusHint = '';

  ngOnInit(): void {
    const statePatientId = this._router.currentNavigation()?.extras.state?.['patientId'];
    const stateConversationId = this._router.currentNavigation()?.extras.state?.['conversationId'];
    const stateStatus = this._router.currentNavigation()?.extras.state?.['status'];
    const queryPatientId = this._route.snapshot.queryParamMap.get('patientId');
    const queryConversationId = this._route.snapshot.queryParamMap.get('conversationId');
    const queryStatus = this._route.snapshot.queryParamMap.get('status');

    this.patientId = statePatientId ?? history.state?.['patientId'] ?? queryPatientId ?? null;
    this.conversationId = stateConversationId ?? history.state?.['conversationId'] ?? queryConversationId ?? null;
    this.conversationStatus = this.parseStatus(stateStatus ?? history.state?.['status'] ?? queryStatus);

    if (this.patientId) {
      this.backRoute = `/patient-record?patientId=${encodeURIComponent(this.patientId)}`;
    }

    if (!this.patientId || !this.conversationId) {
      this._router.navigateByUrl(this.backRoute);
      return;
    }

    if (this.conversationStatus !== null) {
      this.applyStatusHint(this.conversationStatus);
      if (this.conversationStatus !== PatientChatStatus.Completed) {
        this.isLoading = false;
        return;
      }
    }

    if (this.conversationStatus === null) {
      this._patientsService.getChatConversations(this.patientId).pipe(
        catchError(() => of([]))
      ).subscribe((conversations: PatientChatConversationHistory[]) => {
        const currentConversation = conversations.find(
          (conversation: PatientChatConversationHistory) => conversation.conversationId === this.conversationId
        );
        const resolvedStatus = this.resolveConversationStatus(currentConversation);
        this.conversationStatus = resolvedStatus;
        this.applyStatusHint(resolvedStatus);

        if (resolvedStatus !== PatientChatStatus.Completed) {
          this.isLoading = false;
          this._cdr.detectChanges();
          return;
        }

        this.loadSummary();
      });
      return;
    }

    this.loadSummary();
  }

  private loadSummary(): void {
    if (!this.patientId || !this.conversationId) {
      return;
    }

    this._patientsService.getConversationSummary(this.patientId, this.conversationId).pipe(
      catchError((err: unknown) => {
        this.hasError = true;
        console.log(err);
        this._cdr.detectChanges();
        return of(null);
      })
    ).subscribe((response: PatientChatConversationSummary | null) => {
      this.summaryData = response;
      this.isLoading = false;
      this._cdr.detectChanges();
    });
  }

  private applyStatusHint(status: number): void {
    if (status === PatientChatStatus.Finalizing) {
      this.statusHint = 'Результат приёма ещё рассчитывается. Попробуйте открыть эту страницу позже.';
      return;
    }

    if (status === PatientChatStatus.Failed) {
      this.statusHint = 'Во время формирования результата произошла ошибка. Попробуйте завершить приём повторно.';
      return;
    }

    this.statusHint = '';
  }

  private parseStatus(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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

  formatSummaryText(summary: string | null | undefined): string {
    const text = summary ?? '';
    if (!text.trim()) {
      return 'Итоги приёма отсутствуют.';
    }

    return text.trimStart();
  }
}
