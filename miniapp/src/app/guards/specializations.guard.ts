import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';

export const SpecializationsGuard = ()=> {

  const registrationService: RegistrationService = inject(RegistrationService);
  const isSpecializationsEnabled = registrationService.isSpecializationsEnabled;
  const isRegistered = registrationService.isRegistered;
  if(isSpecializationsEnabled || isRegistered){
    return true;
  }

  return inject(Router).createUrlTree(['/registration']);
}
