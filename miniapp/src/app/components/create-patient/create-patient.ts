import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {PatientsService} from '../../services/patients-service';
import {PatientCreateRequestModel} from '../../models/createPatientRequest.model';

@Component({
  selector: 'app-create-patient',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './create-patient.html',
  styleUrl: './create-patient.css',
})
export class CreatePatient implements OnInit {

  form!: FormGroup;
  private _patientService  = inject(PatientsService)

  constructor(private fb: FormBuilder) {
  }

  get fullName(){
    return this.form.get('fullName');
  }


  onSubmit(){

    if(!this.form.valid){
      this.form.markAllAsTouched();
      alert("Заполните обязательные поля");
      return;
    }

    let body:PatientCreateRequestModel = {
      fullName: this.form.value.fullName,
      age: this.form.value.age,
      sex: this.form.value.sex,
      allergies: this.form.value.allergies,
      chronicConditions: this.form.value.chronicConditions,
      notes: this.form.value.notes
    }

    this._patientService.create(body).subscribe()

  }

  ngOnInit(){
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      age: [''],
      sex: [''],
      allergies: [''],
      chronicConditions: [''],
      notes: [''],
    });
  }
}
