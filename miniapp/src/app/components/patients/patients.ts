import {Component, inject, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AsyncPipe} from '@angular/common';
import {IButtonConfig, TransitionButtons} from '../transition-buttons/transition-buttons';
import {BehaviorSubject, combineLatest, map, switchMap} from 'rxjs';
import {PatientsService} from '../../services/patients-service';
import {MenuShell} from '../menu-shell/menu-shell';
import {FormsModule} from '@angular/forms';
import {PatientResponse} from '../../models/patientResponse.model';

@Component({
  selector: 'app-patients',
  imports: [
    AsyncPipe,
    TransitionButtons,
    MenuShell,
    FormsModule
  ],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients implements OnInit{

  router = inject(Router)

  private refresh$ = new BehaviorSubject<void>(undefined);
  private _patientService = inject(PatientsService);
  private search$ = new BehaviorSubject<string>('');

  patients$ = this.refresh$.pipe(
    switchMap(() => this._patientService.getList())
  );

  filteredPatients$ = combineLatest([this.patients$, this.search$]).pipe(
    map(([patients, query]: [PatientResponse[], string]) => {
      const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
      const filtered = normalizedQuery
        ? patients.filter((p: PatientResponse) =>
            p.nickname.toLocaleLowerCase('ru-RU').includes(normalizedQuery)
          )
        : patients;

      return [...filtered].sort((a: PatientResponse, b: PatientResponse) =>
        a.nickname.localeCompare(b.nickname, 'ru-RU', {sensitivity: 'base'})
      );
    })
  );

  searchQuery = '';

  buttonsConfig: IButtonConfig[] = [];

  create (){
    this.router.navigate(['/upsert-patient'], { state:{mode:"create"}});
  }

  openPatientRecord(patientId: string): void {
    this.router.navigate(['/patient-record'], {state: {patientId}});
  }

  ngOnInit(){
    this.initButtons();
  }

  onSearchChange(query: string): void {
    this.search$.next(query);
  }

  private initButtons(): void {

    this.buttonsConfig = [
      { label: 'Создать пациента', onClick: () => this.create() }
    ];
  }
}
