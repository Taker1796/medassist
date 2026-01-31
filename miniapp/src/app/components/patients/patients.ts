import {Component, inject} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {AsyncPipe} from '@angular/common';
import {TransitionButtons} from '../transition-buttons/transition-buttons';
import {BehaviorSubject, switchMap} from 'rxjs';
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
export class Patients {

  router = inject(Router)

  private refresh$ = new BehaviorSubject<void>(undefined);
  private _meService  = inject(MeService)
  private _patientService = inject(PatientsService);

  patients$ = this.refresh$.pipe(
    switchMap(() => this._patientService.getList())
  );

  selected = new Set<string>();

  buttonsConfig = [
    { label: 'Начать чат', onClick: () => alert('запуск чата') },
    { label: 'Создать', onClick: () => this.create() },
    { label: 'Обновить', onClick: () => this.update() },
    { label: 'Удалить', onClick: () => this.delete() },
    { label: 'Назад', routerLink: '' }
  ];

  toggle(code: string) {
    if (this.selected.has(code)) {
      this.selected.delete(code);
      //this.unselect(code);
    } else {
      if (this.selected.size > 0) {
        this.selected.clear();
      }
      this.selected.add(code);
      this.select();
    }
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

    this._patientService.setActive(patientId).subscribe(value => {});
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

  private setLastSelectedPatient(){
    this._meService.me().subscribe(meResponse =>{

      let lastSelectedPatientId = meResponse.lastSelectedPatientId;
      if(lastSelectedPatientId == null || lastSelectedPatientId == ""){
        return;
      }

      this.selected.add(lastSelectedPatientId);
    })
  }

  ngOnInit(){
    this.setLastSelectedPatient();
  }
}
