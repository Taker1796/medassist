import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {PatientsService} from '../../../services/patients-service';
import {UpsertPatientRequest} from '../../../models/upsertPatientRequest.model';
import {Router} from '@angular/router';
import {IButtonConfig, TransitionButtons} from '../../transition-buttons/transition-buttons';

@Component({
  selector: 'app-upsert-patient',
  imports: [
    ReactiveFormsModule,
    TransitionButtons
  ],
  templateUrl: './upsert-patient.html',
  styleUrl: './upsert-patient.css',
})
export class UpsertPatient implements OnInit {

  form!: FormGroup;
  private _patientService  = inject(PatientsService)
  private _router = inject(Router);

  mode: string|null  = null;
  buttonsConfig: IButtonConfig[] = [];

  constructor(private fb: FormBuilder) {
    this.mode = this._router.currentNavigation()?.extras.state?.['mode'];
  }

  get fullName(){
    return this.form.get('fullName');
  }


  goToPatientsMenu(){
    this._router.navigate(['/patients']);
  }


  private upsert() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      alert("Заполните обязательные поля");
      return;
    }

    let body: UpsertPatientRequest = {
      nickname: this.form.value.fullName,
      age: this.form.value.age || null,
      sex: this.form.value.sex || null,
      allergies: this.form.value.allergies || null,
      chronicConditions: this.form.value.chronicConditions || null,
      notes: this.form.value.notes || null
    }

    if(this.mode === 'create'){
      this._patientService.create(body).subscribe(val => {
          alert(`Пациент ${val.nickname} создан!`);
          this._router.navigate(['/patients']);
        }
      )
    }
    else {
      this._patientService.update(body).subscribe(val => {
          this._patientService.setUpdatingPatient(null);
          alert(`Пациент ${val.nickname} обновлен!`);
          this._router.navigate(['/patients']);
        }
      )
    }
  }

  ngOnInit(){
    this.initForm();
    this.initButtons();
  }

  private initForm(){
    if(this.mode === 'create'){
      this.form = this.fb.group({
        fullName: ['', Validators.required],
        age: [''],
        sex: [''],
        allergies: [''],
        chronicConditions: [''],
        notes: [''],
      });
    }
    else{
      // const patient = {
      //   fullName: patient.fullName || '',
      //   age: patient.age ?? '',
      //   sex: patient.sex || '',
      //   allergies: patient.allergies || '',
      //   chronicConditions: patient.chronicConditions || '',
      //   notes: patient.notes || ''
      // };
      //
      // this.form.patchValue(safePatient);
    }
  }

  private initButtons(): void {
    this.buttonsConfig = [
      { label: this.mode === 'create' ? 'Создать': 'Обновить', onClick: () => this.upsert()  },
      { label: 'Назад', onClick: () => this.goToPatientsMenu() }
    ];
  }
}
