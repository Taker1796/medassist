import { Routes } from '@angular/router';
import {Main} from './components/main/main';
import {Doctor} from './components/doctor/doctor';
import {Patients} from './components/patients/patients';
import {Registration} from './components/registration/registration';
import {AuthAndRegistrationGuard} from './guards/auth-and-registration.guard';
import {UserAgreement} from './components/user-agreement/user-agreement';
import {Specializations} from './components/specializations/specializations';
import {UserAgreementGuard} from './guards/user-agreement.guard';
import {SpecializationsGuard} from './guards/specializations.guard';
import {UpsertPatient} from './components/patients/upsert-patient/upsert-patient';
import {Isnottelegram} from './components/errors/isnottelegram/isnottelegram';
import {Consultation} from './components/consultation/consultation';
import {AskAi} from './components/ask-ai/ask-ai';
import {PatientRecord} from './components/patients/patient-record/patient-record';
//canActivate: [AuthAndRegistrationGuard],
export const routes: Routes = [
  { path: '',
      // Гвард на родительском уровне
    canActivate: [AuthAndRegistrationGuard],
    children: [
      { path: '', component: Main },
      { path: 'doctor', component: Doctor },
      { path: 'patients', component: Patients },
      { path: 'consultation', component: Consultation },
      { path: 'ask-ai', component: AskAi },
      { path: 'patient-record', component: PatientRecord },
      { path: 'upsert-patient', component: UpsertPatient },
    ]
  },
  { path: 'registration', component: Registration },
  { path: 'isnottelegram', component: Isnottelegram },
  { path: 'specializations', component: Specializations, canActivate: [SpecializationsGuard] },
  { path: 'user-agreement', component: UserAgreement, canActivate: [UserAgreementGuard] },
];
