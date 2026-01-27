import {inject} from '@angular/core';
import {RegistrationService} from '../services/registration-service';
import {Router} from '@angular/router';
import {map, of, take} from 'rxjs';
import {MeService} from '../services/me-service';

export const RegistrationGuard = ()=> {
  const registrationService = inject(RegistrationService);
  const meService = inject(MeService);
  const router = inject(Router);

  if(registrationService.isRegistered){
    return of(true);
  }

  return meService.getRegistrationStatus().pipe(
    map(isAllow => {
      if (isAllow) return true;
      return router.createUrlTree(['/registration']);
    })
  );
}
