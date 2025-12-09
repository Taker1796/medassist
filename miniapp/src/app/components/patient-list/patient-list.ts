import {Component, inject} from '@angular/core';
import {AsyncPipe} from "@angular/common";
import {TransitionButtons} from "../transition-buttons/transition-buttons";
import {BehaviorSubject, Observable, switchMap} from 'rxjs';
import {Specialization} from '../../models/specializationModel';
import {PatientsService} from '../../services/patients-service';
import {PatientResponse} from '../../models/patientResponse.model';

@Component({
  selector: 'app-patient-list',
    imports: [
        AsyncPipe,
        TransitionButtons
    ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css',
})
export class PatientList {

  buttonsConfig = [
    { label: 'Выбрать', onClick: () => this.select() },
    { label: 'Удалить', onClick: () => this.delete() },
    { label: 'Назад', routerLink: '' }
  ];

  private refresh$ = new BehaviorSubject<void>(undefined);

  patients$ = this.refresh$.pipe(
    switchMap(() => this.patientService.getList())
  );
  patientService = inject(PatientsService);
  selected = new Set<string>();

  toggle(code: string) {
    if (this.selected.has(code)) {
      this.selected.delete(code);
    } else {
      this.selected.add(code);
    }
  }

  delete(){

    if(!this.patientIsSelected()) {
      return;
    }

    const patientId = [...this.selected][0];

    if(confirm(`Уверены, что хотите удалить пациента?`)){
      this.patientService.delete(patientId).subscribe(() => {
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

    this.patientService.select(patientId).subscribe(value => {});
  }

  patientIsSelected(): boolean {
    if (this.selected.size > 1 || this.selected.size == 0) {
      alert("Выберите одного пациента!");
      return false;
    }

    return true;
  }
}
