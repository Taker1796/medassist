import {ChangeDetectorRef, Component, inject} from '@angular/core';
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
  private _cdr = inject(ChangeDetectorRef);

  patients$ = this.refresh$.pipe(
    switchMap(() => this._patientService.getList())
  );

  selected = new Set<string>();

  buttonsConfig = [
    { label: 'Создать сессию', onClick: () => this.select() },
    { label: 'Сбросить сессию', onClick: () => this.unselect() },
    { label: 'Создать пациента', onClick: () => this.create() },
    { label: 'Обновить пациента', onClick: () => this.update() },
    { label: 'Удалить пациента', onClick: () => this.delete() },
    { label: 'Назад', routerLink: '' }
  ];

  toggle(code: string) {
    if (this.selected.has(code)) {
      this.selected.delete(code);
    } else {
      if (this.selected.size > 0) {
        this.selected.clear();
      }
      this.selected.add(code);
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

    this._meService.setSession(patientId).subscribe(value => {
      this.selected = new Set();
      this._cdr.detectChanges(); // Принудительное обновление
      alert('Сессия создана');
    });
  }

  unselect() {

    this._meService.resetSession().subscribe(value => {
      this.selected = new Set();
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




}
