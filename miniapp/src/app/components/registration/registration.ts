import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';

@Component({
  selector: 'app-registration',
  imports: [
    RouterLink
  ],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class Registration {

  private _router: Router = inject(Router);
  private _registrationService: RegistrationService = inject(RegistrationService);

  goToUserAgreement(){
    this._registrationService.isUserAgreementEnabled = true;
    this._router.navigate(['/user-agreement']);
  }


}
