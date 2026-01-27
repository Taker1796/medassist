import { HttpInterceptorFn } from '@angular/common/http';
import {inject} from '@angular/core';
import {PatientsService} from '../services/patients-service';

export const updatePatientInterceptor: HttpInterceptorFn = (req, next) => {

  const patientService = inject(PatientsService);
  const id = patientService.getUpdatingPatient();

  if (req.method !== 'PATCH' || id == null) {
    return next(req);
  }

  const patchedRequest = req.clone({
    setHeaders: {
      'id': id
    }
  });

  return next(patchedRequest);
};
