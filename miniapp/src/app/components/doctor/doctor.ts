import {Component, inject, Inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {RegistrationService} from '../../services/registration-service';

@Component({
  selector: 'app-doctor',
  imports: [
    RouterLink
  ],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor {

  private _regService = inject(RegistrationService);
  private _router = inject(Router)

  goToSpecializations(){
    this._router.navigate(['/specializations'], { state:{mode:"change"}});
  }

  deleteRegistration(){
    if(confirm("Вы уверены?")){
      this._regService.delete();
    }
  }


}
