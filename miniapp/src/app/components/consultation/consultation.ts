import {Component, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Chat} from '../chat/chat';
import {MenuShell} from '../menu-shell/menu-shell';

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
export class Consultation {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  backRoute = '/patients';
  patientId: string | null = null;

  constructor() {
    const statePatientId = this._router.currentNavigation()?.extras.state?.['patientId'];
    const historyPatientId = history.state?.['patientId'];
    const queryPatientId = this._route.snapshot.queryParamMap.get('patientId');
    const patientId = statePatientId ?? historyPatientId ?? queryPatientId ?? null;
    this.patientId = patientId;

    if (patientId) {
      this.backRoute = `/patient-record?patientId=${encodeURIComponent(patientId)}`;
    }
  }
}
