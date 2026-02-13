import {Component, inject, Inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {MeService} from '../../services/me-service';
import {pattern} from '@angular/forms/signals';
import {MeResponse} from '../../models/meResponse.model';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {TransitionButtons} from '../transition-buttons/transition-buttons';

@Component({
  selector: 'app-doctor',
  imports: [
    RouterLink,
    AsyncPipe,
    TransitionButtons
  ],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor {

  private _regService = inject(RegistrationService);
  private _meService = inject(MeService);
  private _router = inject(Router)

  buttonsConfig = [
    { label: 'Выбрать специализацию', onClick: () => this.goToSpecializations() },
    { label: 'Обновить данные', onClick: () => this.goToEditDataForm() },
    { label: 'Удалить регистрацию', onClick: () => this.deleteRegistration() },
    { label: 'Назад', routerLink: '' }
  ];

  userData$ = this._meService.me();

  goToSpecializations(){
    this._router.navigate(['/specializations'], { state:{mode:"change"}});
  }

  deleteRegistration(){
    if(confirm("Вы уверены?")){
      this._regService.delete();
    }
  }

  goToEditDataForm(){
    this._router.navigate(['/update-doctor']);
  }
}
