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
  private readonly _patientId: string|null = null;

  mode: string|null  = null;
  buttonsConfig: IButtonConfig[] = [];


  constructor(private fb: FormBuilder) {
    this.mode = this._router.currentNavigation()?.extras.state?.['mode'];
    this._patientId = this._router.currentNavigation()?.extras.state?.['patientId'];
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
      ageYears: this.form.value.age || null,
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

      if(this._patientId == null){

        console.log('patientId is null');
        return;
      }

      this._patientService.update(body, this._patientId).subscribe(val => {

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

    this.form = this.fb.group({
      fullName: ['', Validators.required],
      age: [''],
      sex: [''],
      allergies: [''],
      chronicConditions: [''],
      notes: [''],
    });

    if (this.mode === 'update'){

      if(this._patientId == null){
        console.log('patientId is null on init');
        return;
      }

      this._patientService.getById(this._patientId).subscribe(patient => {
        const safePatient = {
          fullName: patient.nickname || '',
          age: patient.ageYears ?? '',
          sex: patient.sex || '',
          allergies: patient.allergies || '',
          chronicConditions: patient.chronicConditions || '',
          notes: patient.notes || ''
        };

        this.form.patchValue(safePatient);

      });

    }
  }

  private initButtons(): void {
    this.buttonsConfig = [
      { label: this.mode === 'create' ? 'Создать': 'Обновить', onClick: () => this.upsert()  },
      { label: 'Назад', onClick: () => this.goToPatientsMenu() }
    ];
  }
}
