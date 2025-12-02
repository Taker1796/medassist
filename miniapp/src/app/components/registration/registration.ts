import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';

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

  goToUserAgreement(){
    this._router.navigate(['/user-agreement']);
  }


}
