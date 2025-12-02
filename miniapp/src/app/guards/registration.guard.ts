import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';

export const RegistrationGuard = ()=> {
  const isRegister = inject(RegistrationService).isRegistered;

  if(isRegister){
    return true;
  }

  return inject(Router).createUrlTree(['/registration']);
}
