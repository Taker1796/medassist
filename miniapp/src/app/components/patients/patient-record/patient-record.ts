import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Router} from '@angular/router';
import {PatientsService} from '../../../services/patients-service';
import {PatientResponse} from '../../../models/patientResponse.model';
import {PatientVisit} from '../../../models/patientVisit.model';
import {MenuShell} from '../../menu-shell/menu-shell';
import {DatePipe} from '@angular/common';
import {catchError, finalize, forkJoin, of} from 'rxjs';
import {firstValueFrom} from 'rxjs';
import {PatientChatCurrentResponse} from '../../../models/patientChatCurrentResponse.model';
import {PatientChatTurn} from '../../../models/patientChatTurn.model';

@Component({
  selector: 'app-patient-record',
  imports: [
    MenuShell,
    DatePipe
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
  visits: PatientVisit[] = [];
  selectedVisit: PatientVisit | null = null;
  patientId: string | null = null;
  hasActiveConversation = false;
  hasVisitsApi = true;
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
      this._cdr.detectChanges();
    } catch (err: unknown) {
      alert('Не удалось завершить приём. Попробуйте еще раз.');
      console.log(err);
    } finally {
      this.isCompletingVisit = false;
      this._cdr.detectChanges();
    }
  }

  selectVisit(visit: PatientVisit): void {
    this.selectedVisit = visit;
  }

  private openConsultation(): void {
    this._router.navigate(['/consultation'], {
      queryParams: {patientId: this.patientId},
      state: {patientId: this.patientId}
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

    this.loadVisits();
  }

  private loadVisits(): void {
    if (!this.patientId) return;

    this._patientsService.getVisits(this.patientId).pipe(
      catchError(() => {
        this.hasVisitsApi = false;
        return of([]);
      })
    ).subscribe((visits: PatientVisit[]) => {
      this.visits = visits;
      if (!this.selectedVisit && visits.length > 0) {
        this.selectedVisit = visits[0];
      }
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
