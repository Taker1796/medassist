import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {catchError, of} from 'rxjs';
import {MenuShell} from '../../menu-shell/menu-shell';
import {PatientsService} from '../../../services/patients-service';
import {PatientChatConversationSummary} from '../../../models/patientChatConversationSummary.model';
import {DatePipe} from '@angular/common';

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

  ngOnInit(): void {
    const statePatientId = this._router.currentNavigation()?.extras.state?.['patientId'];
    const stateConversationId = this._router.currentNavigation()?.extras.state?.['conversationId'];
    const queryPatientId = this._route.snapshot.queryParamMap.get('patientId');
    const queryConversationId = this._route.snapshot.queryParamMap.get('conversationId');

    this.patientId = statePatientId ?? history.state?.['patientId'] ?? queryPatientId ?? null;
    this.conversationId = stateConversationId ?? history.state?.['conversationId'] ?? queryConversationId ?? null;

    if (this.patientId) {
      this.backRoute = `/patient-record?patientId=${encodeURIComponent(this.patientId)}`;
    }

    if (!this.patientId || !this.conversationId) {
      this._router.navigateByUrl(this.backRoute);
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
}
