import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';
import {TransitionButtons} from '../transition-buttons/transition-buttons';

@Component({
  selector: 'app-user-agreement',
  imports: [
    TransitionButtons
  ],
  templateUrl: './user-agreement.html',
  styleUrl: './user-agreement.css',
})
export class UserAgreement {
  isConsentReceived = signal(false);
  private _router  = inject(Router);
  private _registrationService: RegistrationService = inject(RegistrationService);
  buttonsConfig = [
    { label: 'Далее', onClick: () => this.goToSpecializations(), disabled: this.isConsentReceived },
    { label: 'Назад', routerLink: '' }
  ];

  goToSpecializations(){
    this._registrationService.isSpecializationsEnabled = true;
    this._router.navigate(['/specializations']);
  }

}
