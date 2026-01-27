import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {customHeaderInterceptor} from './interceptors/custom-header-interceptor';
import {updatePatientInterceptor} from './interceptors/update-patient-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      customHeaderInterceptor,
      updatePatientInterceptor]))
  ]
};
