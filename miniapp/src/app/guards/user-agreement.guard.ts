import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';

export const UserAgreementGuard = ()=> {
  const isUserAgreementEnabled = inject(RegistrationService).isUserAgreementEnabled;
  if(isUserAgreementEnabled){
    return true;
  }

  return inject(Router).createUrlTree(['/registration']);
}
