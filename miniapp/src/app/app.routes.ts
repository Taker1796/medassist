import { Routes } from '@angular/router';
import {Dialogs} from './components/dialogs/dialogs';
import {Main} from './components/main/main';
import {Doctor} from './components/doctor/doctor';
import {Patients} from './components/patients/patients';
import {Registration} from './components/registration/registration';
import {RegistrationGuard} from './guards/registration.guard';
import {UserAgreement} from './components/user-agreement/user-agreement';
import {Specializations} from './components/specializations/specializations';

export const routes: Routes = [
  { path: '', component: Main,
    canActivate: [RegistrationGuard],   // Гвард на родительском уровне
    children: [
      { path: 'dialogs', component: Dialogs },
      { path: 'doctor', component: Doctor },
      { path: 'patients', component: Patients },
      { path: 'specializations', component: Specializations }
    ]
  },
  { path: 'registration', component: Registration },
  { path: 'user-agreement', component: UserAgreement }
];
