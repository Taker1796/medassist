import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Chat} from '../chat/chat';
import {MenuShell} from '../menu-shell/menu-shell';
import {PatientsService} from '../../services/patients-service';
import {catchError, finalize, map, of} from 'rxjs';
import {PatientResponse} from '../../models/patientResponse.model';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [
    Chat,
    MenuShell
  ],
  templateUrl: './consultation.html',
  styleUrl: './consultation.css',
})
export class Consultation implements OnInit {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _patientsService = inject(PatientsService);

  backRoute = '/patients';
  patientId: string | null = null;
  title = 'Пациент';
  isCompletingVisit = false;
  private _statePatientNickname: string | null = null;

  constructor() {
    const statePatientId = this._router.currentNavigation()?.extras.state?.['patientId'];
    const statePatientNickname = this._router.currentNavigation()?.extras.state?.['patientNickname'];
    const historyPatientId = history.state?.['patientId'];
    const historyPatientNickname = history.state?.['patientNickname'];
    const queryPatientId = this._route.snapshot.queryParamMap.get('patientId');
    const patientId = statePatientId ?? historyPatientId ?? queryPatientId ?? null;
    this.patientId = patientId;
    this._statePatientNickname = statePatientNickname ?? historyPatientNickname ?? null;

    if (patientId) {
      this.backRoute = `/patient-record?patientId=${encodeURIComponent(patientId)}`;
    }
  }

  ngOnInit(): void {
    if (this._statePatientNickname) {
      this.title = `Пациент: ${this._statePatientNickname}`;
      return;
    }

    if (!this.patientId) {
      return;
    }

    this._patientsService.getById(this.patientId).pipe(
      catchError(() => of<PatientResponse | null>(null))
    ).subscribe((patient: PatientResponse | null) => {
      if (!patient?.nickname) {
        return;
      }

      this.title = `Пациент: ${patient.nickname}`;
    });
  }

  completeVisit(): void {
    if (!this.patientId || this.isCompletingVisit) {
      return;
    }

    this.isCompletingVisit = true;
    this._patientsService.completeCurrentConversation(this.patientId).pipe(
      map(() => true),
      catchError((err: unknown) => {
        alert('Не удалось завершить приём. Попробуйте еще раз.');
        console.log(err);
        return of(false);
      }),
      finalize(() => {
        this.isCompletingVisit = false;
      })
    ).subscribe((isSuccess: boolean) => {
      if (!isSuccess || !this.patientId) {
        return;
      }

      this._router.navigate(['/patient-record'], {
        queryParams: {patientId: this.patientId},
        state: {patientId: this.patientId}
      });
    });
  }
}
