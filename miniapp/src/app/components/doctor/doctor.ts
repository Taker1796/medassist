import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {RegistrationService} from '../../services/registration-service';
import {MeService} from '../../services/me-service';
import {TransitionButtons} from '../transition-buttons/transition-buttons';
import {MenuShell} from '../menu-shell/menu-shell';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MeResponse} from '../../models/meResponse.model';
import {UpdateMeRequest} from '../../models/updateMeRequest.model';
import {ToastService} from '../../services/toast.service';

@Component({
  selector: 'app-doctor',
  imports: [
    TransitionButtons,
    MenuShell,
    ReactiveFormsModule
  ],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor implements OnInit {

  private _regService = inject(RegistrationService);
  private _meService = inject(MeService);
  private _fb = inject(FormBuilder);
  private _cdr = inject(ChangeDetectorRef);
  private _toast = inject(ToastService);

  buttonsConfig = [
    { label: 'Удалить регистрацию', onClick: () => this.deleteRegistration() }
  ];

  userData: MeResponse | null = null;
  doctorForm: FormGroup = this._fb.group({
    nickName: ['']
  });

  ngOnInit(): void {
    this.loadDoctorData();
  }

  deleteRegistration(){
    if(confirm("Вы уверены?")){
      this._regService.delete();
    }
  }

  saveDoctorData(): void {
    const body: UpdateMeRequest = {
      nickname: this.doctorForm.value.nickName || null
    };

    this._meService.update(body).subscribe((updated: MeResponse) => {
      this.userData = updated;
      this.doctorForm.patchValue({ nickName: updated.nickname || '' });
      this._cdr.detectChanges();
      this._toast.success('Данные обновлены');
    });
  }

  private loadDoctorData(): void {
    this._meService.me().subscribe((me: MeResponse) => {
      this.userData = me;
      this.doctorForm.patchValue({ nickName: me.nickname || '' });
      this._cdr.detectChanges();
    });
  }
}
