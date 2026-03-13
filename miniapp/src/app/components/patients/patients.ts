import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AsyncPipe} from '@angular/common';
import {IButtonConfig, TransitionButtons} from '../transition-buttons/transition-buttons';
import {BehaviorSubject, catchError, map, of, switchMap, take} from 'rxjs';
import {PatientsService} from '../../services/patients-service';
import {MeService} from '../../services/me-service';
import {PatientResponse} from '../../models/patientResponse.model';
import {MeResponse} from '../../models/meResponse.model';
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
  private _meService  = inject(MeService)
  private _patientService = inject(PatientsService);
  private _cdr = inject(ChangeDetectorRef);
  private _endSessionButtonLabel = 'Завершить приём';

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

  delete(){

    if(!this.patientIsSelected()) {
      return;
    }

    const patientId = [...this.selected][0];

    if(confirm(`Уверены, что хотите удалить пациента?`)){
      this._patientService.delete(patientId).subscribe(() => {
        alert("Пациент удалён!");
        this.refresh$.next();
      });
    }
  }

  select() {

    if(!this.patientIsSelected()) {
      return;
    }

    const patientId = [...this.selected][0];

    this._meService.setSession(patientId).subscribe(() => {
      this.selected = new Set();
      this.patients$.pipe(
        take(1),
        map((patients: PatientResponse[]) => patients.find((p: PatientResponse) => p.id === patientId))
      ).subscribe((patient: PatientResponse | undefined) => {
          if (patient) {
            this.setLabelToEndSessionButton(patient.nickname);
          }

          this._cdr.detectChanges();
        }
      );
      this.router.navigate(['/consultation']);
    });
  }

  unselect() {

    this._meService.resetSession().subscribe(() => {
      this.selected = new Set();
      this.setLabelToEndSessionButton(null);
      this._cdr.detectChanges(); // Принудительное обновление
      alert('Приём завершен');
    });
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

  update (){

    if(!this.patientIsSelected()) {
      return;
    }

    const patientId = [...this.selected][0];

    this.router.navigate(['/upsert-patient'], { state:{mode:"update", patientId: patientId}});
  }

  ngOnInit(){
    this.initButtons();
    this.syncEndSessionButtonLabel();
  }

  private initButtons(): void {

    this.buttonsConfig = [
      { label: 'Начать приём', onClick: () => this.select() },
      { label:  this._endSessionButtonLabel, onClick: () => this.unselect() },
      { label: 'Создать пациента', onClick: () => this.create() },
      { label: 'Обновить пациента', onClick: () => this.update() },
      { label: 'Удалить пациента', onClick: () => this.delete() },
      { label: 'Назад', routerLink: '' }
    ];
  }

  private syncEndSessionButtonLabel(): void {
    this._meService.me().pipe(
      take(1),
      switchMap((me: MeResponse) => {
        if (me.lastSelectedPatientNickname) {
          return of(me.lastSelectedPatientNickname);
        }

        if (!me.lastSelectedPatientId) {
          return of(null);
        }

        return this._patientService.getById(me.lastSelectedPatientId).pipe(
          map((patient: PatientResponse) => patient.nickname ?? null),
          catchError(() => of(null))
        );
      })
    ).subscribe((patientName: string | null) => {
      this.setLabelToEndSessionButton(patientName);
      this._cdr.detectChanges();
    });
  }

  private setLabelToEndSessionButton(patientName: string|null) {

    if(patientName != null){
      const displayName =
        patientName.length > 15 ? patientName.slice(0, 12) + '...' : patientName;
      this.buttonsConfig[1].label =
        this._endSessionButtonLabel + ' [' + displayName + ']';
    }
    else{
      this.buttonsConfig[1].label = this._endSessionButtonLabel;
    }
  }
}
