import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Router} from '@angular/router';
import {PatientsService} from '../../../services/patients-service';
import {MeService} from '../../../services/me-service';
import {PatientResponse} from '../../../models/patientResponse.model';
import {PatientVisit} from '../../../models/patientVisit.model';
import {MenuShell} from '../../menu-shell/menu-shell';
import {DatePipe} from '@angular/common';
import {catchError, forkJoin, of} from 'rxjs';
import {MeResponse} from '../../../models/meResponse.model';

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
  private _meService = inject(MeService);
  private _cdr = inject(ChangeDetectorRef);

  patient: PatientResponse | null = null;
  visits: PatientVisit[] = [];
  selectedVisit: PatientVisit | null = null;
  patientId: string | null = null;
  isCurrentPatientActive = false;
  hasVisitsApi = true;

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
    if (!this.patientId) return;

    this._meService.setSession(this.patientId).subscribe(() => {
      this.isCurrentPatientActive = true;
      this._router.navigate(['/consultation'], {
        queryParams: {patientId: this.patientId},
        state: {patientId: this.patientId}
      });
    });
  }

  endVisit(): void {
    this._meService.resetSession().subscribe(() => {
      this.isCurrentPatientActive = false;
      alert('Приём завершен');
      this._router.navigate(['/patients']);
    });
  }

  openConsultation(): void {
    if (!this.patientId) return;
    this._router.navigate(['/consultation'], {
      queryParams: {patientId: this.patientId},
      state: {patientId: this.patientId}
    });
  }

  openEditPatient(): void {
    if (!this.patientId) return;
    this._router.navigate(['/upsert-patient'], {state: {mode: 'update', patientId: this.patientId}});
  }

  selectVisit(visit: PatientVisit): void {
    this.selectedVisit = visit;
  }

  private loadData(): void {
    if (!this.patientId) return;

    forkJoin({
      patient: this._patientsService.getById(this.patientId),
      me: this._meService.me()
    }).subscribe(({patient, me}: {patient: PatientResponse; me: MeResponse}) => {
      this.patient = patient;
      this.isCurrentPatientActive = me.lastSelectedPatientId === this.patientId;
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
}
