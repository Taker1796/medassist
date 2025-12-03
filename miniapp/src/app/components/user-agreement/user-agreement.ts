import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';

@Component({
  selector: 'app-user-agreement',
  imports: [
    RouterLink
  ],
  templateUrl: './user-agreement.html',
  styleUrl: './user-agreement.css',
})
export class UserAgreement {

  isConsentReceived = signal(false);
  private _router  = inject(Router);
  private _registrationService: RegistrationService = inject(RegistrationService);

  goToSpecializations(){
    this._registrationService.isSpecializationsEnabled = true;
    this._router.navigate(['/specializations']);
  }

}
