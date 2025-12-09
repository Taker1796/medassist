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

  onSubmit(){
     if(this.form.valid){

       let body:PatientCreateRequestModel = {
         fullName: this.form.value.fullName,
         birthDate: this.form.value.birthDate ? new Date(this.form.value.birthDate) : null,
         sex: this.form.value.sex,
         phone: this.form.value.phone,
         email: this.form.value.email,
         allergies: this.form.value.allergies,
         chronicConditions: this.form.value.chronicConditions,
         tags: this.form.value.tags,
         notes: this.form.value.notes,
         status: this.form.value.status
       }

       this._patientService.create(body).subscribe()

     }
     alert("Валидация не пройдена");
  }

  ngOnInit(){
    this.form = this.fb.group({
      fullName: [''],
      birthDate: [''],
      sex: [''],
      phone: [''],
      email: ['', Validators.email],
      allergies: [''],
      chronicConditions: [''],
      tags: [''],
      notes: [''],
      status:['']
    });
  }
}
