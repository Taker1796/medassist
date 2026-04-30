import { Routes } from '@angular/router';
import {Main} from './components/main/main';
import {Doctor} from './components/doctor/doctor';
import {Patients} from './components/patients/patients';
import {Specializations} from './components/specializations/specializations';
import {UpsertPatient} from './components/patients/upsert-patient/upsert-patient';
import {Consultation} from './components/consultation/consultation';
import {AskAi} from './components/ask-ai/ask-ai';
import {PatientRecord} from './components/patients/patient-record/patient-record';
import {PatientVisitSummary} from './components/patients/patient-visit-summary/patient-visit-summary';
import {AuthGuard} from './guards/auth.guard';
import {Login} from './components/auth/login/login';
import {Register} from './components/auth/register/register';
import {PublicOnlyGuard} from './guards/public-only.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: Main },
      { path: 'doctor', component: Doctor },
      { path: 'patients', component: Patients },
      { path: 'consultation', component: Consultation },
      { path: 'ask-ai', component: AskAi },
      { path: 'patient-record', component: PatientRecord },
      { path: 'patient-visit-summary', component: PatientVisitSummary },
      { path: 'upsert-patient', component: UpsertPatient },
    ]
  },
  { path: 'login', component: Login, canActivate: [PublicOnlyGuard] },
  { path: 'register', component: Register, canActivate: [PublicOnlyGuard] },
  { path: 'registration', redirectTo: 'register', pathMatch: 'full' },
  { path: 'user-agreement', redirectTo: 'register', pathMatch: 'full' },
  { path: 'isnottelegram', redirectTo: 'login', pathMatch: 'full' },
  { path: 'specializations', component: Specializations, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];
