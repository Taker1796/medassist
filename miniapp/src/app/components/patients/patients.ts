import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {AsyncPipe} from '@angular/common';
import {IButtonConfig, TransitionButtons} from '../transition-buttons/transition-buttons';
import {BehaviorSubject, map, switchMap} from 'rxjs';
import {PatientsService} from '../../services/patients-service';
import {MeService} from '../../services/me-service';

@Component({
  selector: 'app-patients',
  imports: [
    AsyncPipe,
    TransitionButtons
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
  private _endSessionButtonLabel = 'Завершить сессию';

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

    this._meService.setSession(patientId).subscribe(value => {
      this.selected = new Set();
      this.patients$.pipe(
        map(patients => patients.find(p => p.id === patientId))
      ).subscribe(value => {
          if (value) {
            this.setLabelToEndSessionButton(value.nickname);
          }

          this._cdr.detectChanges();
        }
      );
      alert('Сессия создана');
    });
  }

  unselect() {

    this._meService.resetSession().subscribe(value => {
      this.selected = new Set();
      this.setLabelToEndSessionButton(null);
      this._cdr.detectChanges(); // Принудительное обновление
      alert('Сессия удалена');
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
  }

  private initButtons(): void {

    this.buttonsConfig = [
      { label: 'Создать сессию с пациентом', onClick: () => this.select() },
      { label:  this._endSessionButtonLabel, onClick: () => this.unselect() },
      { label: 'Создать пациента', onClick: () => this.create() },
      { label: 'Обновить пациента', onClick: () => this.update() },
      { label: 'Удалить пациента', onClick: () => this.delete() },
      { label: 'Назад', routerLink: '' }
    ];

    this._meService.me().subscribe(me => {
      if (me.lastSelectedPatientNickname !== null) {

        this.setLabelToEndSessionButton(me.lastSelectedPatientNickname);
      }
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
