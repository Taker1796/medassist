import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TransitionButtons} from '../../../transition-buttons/transition-buttons';
import {Router} from '@angular/router';
import {MeService} from '../../../../services/me-service';
import {UpdateMeRequest} from '../../../../models/updateMeRequest.model';

@Component({
  selector: 'app-update',
  imports: [
    ReactiveFormsModule,
    TransitionButtons
  ],
  templateUrl: './update-doctor.html',
  styleUrl: './update-doctor.css',
})
export class UpdateDoctor implements OnInit {

  doctorForm!: FormGroup;
  buttonsConfig = [
    { label: 'Обновить', onClick: () => this.updateDoctor()  },
    { label: 'Назад', onClick: () => this.goToDoctorMenu() }
  ];

  private _router = inject(Router);
  private _meService  = inject(MeService)

  constructor(private fb: FormBuilder) {}

  get nickName(){
    return this.doctorForm.get('nickName');
  }

  private initForm(){

    this.doctorForm = this.fb.group({
      nickName: [''],
    });
  }

  private goToDoctorMenu(){
    this._router.navigate(['/doctor']);
  }

  private updateDoctor(){

    const body :UpdateMeRequest = {
      nickname: this.doctorForm.value.nickName || null,
    };

    this._meService.update(body).subscribe(val => alert("Данные обновлены"));
  }

  private initData(){

    this._meService.me().subscribe(me => {
      const myInfo = {
        nickName: me.nickname || ''
      };

      this.doctorForm.patchValue(myInfo);

    });

  }

  ngOnInit() {
    this.initForm();
    this.initData();
  }

}
