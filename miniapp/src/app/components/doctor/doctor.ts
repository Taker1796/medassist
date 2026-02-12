import {Component, inject, Inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {MeService} from '../../services/me-service';
import {pattern} from '@angular/forms/signals';
import {MeResponse} from '../../models/meResponse.model';
import {Observable} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-doctor',
  imports: [
    RouterLink,
    AsyncPipe
  ],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor {

  private _regService = inject(RegistrationService);
  private _meService = inject(MeService);
  private _router = inject(Router)

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
