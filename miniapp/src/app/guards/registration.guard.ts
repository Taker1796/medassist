import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';
import {map, of, take} from 'rxjs';

export const RegistrationGuard = ()=> {
  const registrationService = inject(RegistrationService);
  const router = inject(Router);

  if(registrationService.isRegistered){
    return of(true);
  }

  return registrationService.getRegistrationStatus().pipe(
    map(isAllow => {
      if (isAllow) return true;
      return router.createUrlTree(['/registration']);
    })
  );
}
