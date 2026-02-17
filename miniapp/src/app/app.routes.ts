import { Routes } from '@angular/router';
import {Main} from './components/main/main';
import {Doctor} from './components/doctor/doctor';
import {Patients} from './components/patients/patients';
import {Registration} from './components/registration/registration';
import {RegistrationGuard} from './guards/registration.guard';
import {UserAgreement} from './components/user-agreement/user-agreement';
import {Specializations} from './components/specializations/specializations';
import {UserAgreementGuard} from './guards/user-agreement.guard';
import {SpecializationsGuard} from './guards/specializations.guard';
import {UpsertPatient} from './components/patients/upsert-patient/upsert-patient';
import {UpdateDoctor} from './components/doctor/data/update/update-doctor';
import {Isnottelegram} from './components/errors/isnottelegram/isnottelegram';
import {AuthGuard} from './guards/auth.guard';

export const routes: Routes = [
  { path: '',
    canActivate: [AuthGuard, RegistrationGuard],   // Гвард на родительском уровне
    children: [
      { path: '', component: Main },
      { path: 'doctor', component: Doctor },
      { path: 'patients', component: Patients },
      { path: 'upsert-patient', component: UpsertPatient },
      { path: 'update-doctor', component: UpdateDoctor },
    ]
  },
  { path: 'registration', component: Registration, canActivate: [AuthGuard]  },
  { path: 'isnottelegram', component: Isnottelegram },
  { path: 'specializations', component: Specializations, canActivate: [AuthGuard, SpecializationsGuard] },
  { path: 'user-agreement', component: UserAgreement, canActivate: [AuthGuard, UserAgreementGuard] },
];
