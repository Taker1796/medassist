import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {PatientsService} from '../../../services/patients-service';
import {UpsertPatientRequest} from '../../../models/upsertPatientRequest.model';
import {Router} from '@angular/router';
import {IButtonConfig, TransitionButtons} from '../../transition-buttons/transition-buttons';
import {BlurOnOutsideTap} from '../../../directives/blur-on-outside-tap';
import {PatientResponse} from '../../../models/patientResponse.model';
import {MenuShell} from '../../menu-shell/menu-shell';

@Component({
  selector: 'app-upsert-patient',
  imports: [
    ReactiveFormsModule,
    TransitionButtons,
    BlurOnOutsideTap,
    MenuShell
  ],
  templateUrl: './upsert-patient.html',
  styleUrl: './upsert-patient.css',
})
export class UpsertPatient implements OnInit {

  form!: FormGroup;
  private _patientService  = inject(PatientsService)
  private _router = inject(Router);
  private readonly _patientId: string|null = null;

  mode: 'create' | 'update' = 'create';
  buttonsConfig: IButtonConfig[] = [];
  backRoute = '/patients';


  constructor(private fb: FormBuilder) {
    const stateMode = this._router.currentNavigation()?.extras.state?.['mode']
      ?? history.state?.['mode']
      ?? null;
    this.mode = stateMode === 'update' ? 'update' : 'create';

    this._patientId = this._router.currentNavigation()?.extras.state?.['patientId']
      ?? history.state?.['patientId']
      ?? null;

    if (this.mode === 'update' && this._patientId) {
      this.backRoute = `/patient-record?patientId=${encodeURIComponent(this._patientId)}`;
    }
  }

  get fullName(){
    return this.form.get('fullName');
  }


  private upsert() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      alert("Заполните обязательные поля");
      return;
    }

    const ageValue = this.form.value.age;
    const sexValue = this.form.value.sex;

    let body: UpsertPatientRequest = {
      nickname: this.form.value.fullName,
      ageYears: ageValue === null || ageValue === '' ? null : Number(ageValue),
      sex: sexValue === null || sexValue === '' ? null : Number(sexValue),
      allergies: this.form.value.allergies || null,
      chronicConditions: this.form.value.chronicConditions || null,
      notes: this.form.value.notes || null
    }

    if(this.mode === 'create'){
      this._patientService.create(body).subscribe((val: UpsertPatientRequest) => {
          alert(`Пациент ${val.nickname} создан!`);
          this._router.navigate(['/patients']);
        }
      )
      return;
    }

    if(this._patientId == null){

      console.log('patientId is null');
      return;
    }

    this._patientService.update(body, this._patientId).subscribe((val: UpsertPatientRequest) => {

        alert(`Пациент ${val.nickname} обновлен!`);
        this._router.navigateByUrl(`/patient-record?patientId=${encodeURIComponent(this._patientId!)}`);
      }
    );
  }

  private deletePatient(): void {
    if (this.mode !== 'update' || !this._patientId) {
      return;
    }

    if (!confirm('Уверены, что хотите удалить пациента?')) {
      return;
    }

    this._patientService.delete(this._patientId).subscribe(() => {
      alert('Пациент удалён');
      this._router.navigate(['/patients']);
    });
  }

  ngOnInit(){
    this.initForm();
    this.initButtons();
  }

  private initForm(){

    this.form = this.fb.group({
      fullName: ['', Validators.required],
      age: [''],
      sex: [null],
      allergies: [''],
      chronicConditions: [''],
      notes: [''],
    });

    if (this.mode === 'update'){

      if(this._patientId == null){
        console.log('patientId is null on init');
        return;
      }

      this._patientService.getById(this._patientId).subscribe((patient: PatientResponse) => {
        const safePatient = {
          fullName: patient.nickname || '',
          age: patient.ageYears ?? '',
          sex: patient.sex ?? null,
          allergies: patient.allergies || '',
          chronicConditions: patient.chronicConditions || '',
          notes: patient.notes || ''
        };

        this.form.patchValue(safePatient);

      });

    }
  }

  private initButtons(): void {
    if (this.mode === 'update') {
      this.buttonsConfig = [
        { label: 'Обновить', onClick: () => this.upsert()  },
        { label: 'Удалить пациента', onClick: () => this.deletePatient() }
      ];
      return;
    }

    this.buttonsConfig = [
      { label: 'Создать', onClick: () => this.upsert()  }
    ];
  }
}
