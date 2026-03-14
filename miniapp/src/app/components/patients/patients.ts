import {Component, inject, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AsyncPipe} from '@angular/common';
import {IButtonConfig, TransitionButtons} from '../transition-buttons/transition-buttons';
import {BehaviorSubject, switchMap} from 'rxjs';
import {PatientsService} from '../../services/patients-service';
import {MenuShell} from '../menu-shell/menu-shell';

@Component({
  selector: 'app-patients',
  imports: [
    AsyncPipe,
    TransitionButtons,
    MenuShell
  ],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients implements OnInit{

  router = inject(Router)

  private refresh$ = new BehaviorSubject<void>(undefined);
  private _patientService = inject(PatientsService);

  patients$ = this.refresh$.pipe(
    switchMap(() => this._patientService.getList())
  );

  selected = new Set<string>();

  buttonsConfig: IButtonConfig[] = [];

  toggle(code: string) {
    if (this.selected.has(code)) {
      this.selected.delete(code);
    } else {
      if (this.selected.size > 0) {
        this.selected.clear();
      }
      this.selected.add(code);
    }

    this.selected = new Set(this.selected);
  }

  patientIsSelected(): boolean {
    if (this.selected.size > 1 || this.selected.size == 0) {
      alert("Выберите одного пациента!");
      return false;
    }

    return true;
  }

  create (){
    this.router.navigate(['/upsert-patient'], { state:{mode:"create"}});
  }

  openPatientRecord(): void {
    if (!this.patientIsSelected()) {
      return;
    }

    const patientId = [...this.selected][0];
    this.router.navigate(['/patient-record'], {state: {patientId}});
  }

  ngOnInit(){
    this.initButtons();
  }

  private initButtons(): void {

    this.buttonsConfig = [
      { label: 'Открыть карту пациента', onClick: () => this.openPatientRecord() },
      { label: 'Создать пациента', onClick: () => this.create() }
    ];
  }
}
