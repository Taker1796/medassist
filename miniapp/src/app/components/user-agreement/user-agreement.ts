import {Component, inject, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';

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
  _router  = inject(Router);

  goToSpecializations(){
    this._router.navigate(['/specializations']);
  }
}
