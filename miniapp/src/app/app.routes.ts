import { Routes } from '@angular/router';
import {Dialogs} from './components/dialogs/dialogs';
import {Main} from './components/main/main';
import {Doctor} from './components/doctor/doctor';
import {Patients} from './components/patients/patients';
import {Registration} from './components/registration/registration';
import {RegistrationGuard} from './guards/registration.guard';
import {UserAgreement} from './components/user-agreement/user-agreement';
import {Specializations} from './components/specializations/specializations';
import {UserAgreementGuard} from './guards/user-agreement.guard';
import {SpecializationsGuard} from './guards/specializations.guard';
import {CreatePatient} from './components/create-patient/create-patient';

export const routes: Routes = [
  { path: '',
    canActivate: [RegistrationGuard],   // Гвард на родительском уровне
    children: [
      { path: '', component: Main },
      { path: 'dialogs', component: Dialogs },
      { path: 'doctor', component: Doctor },
      { path: 'patients', component: Patients },
      { path: 'create-patient', component: CreatePatient }
    ]
  },
  { path: 'registration', component: Registration },
  { path: 'specializations', component: Specializations, canActivate: [SpecializationsGuard] },
  { path: 'user-agreement', component: UserAgreement, canActivate: [UserAgreementGuard] },
];
