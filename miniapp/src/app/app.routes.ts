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
import {Landing} from './components/landing/landing';

export const routes: Routes = [
  { path: '', component: Landing },
  {
    path: 'app',
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
      { path: 'specializations', component: Specializations },
    ]
  },
  { path: 'login', component: Login, canActivate: [PublicOnlyGuard] },
  { path: 'register', component: Register, canActivate: [PublicOnlyGuard] },
  { path: 'registration', redirectTo: 'register', pathMatch: 'full' },
  { path: 'user-agreement', redirectTo: 'register', pathMatch: 'full' },
  { path: 'isnottelegram', redirectTo: 'login', pathMatch: 'full' },
  { path: 'doctor', redirectTo: 'app/doctor', pathMatch: 'full' },
  { path: 'patients', redirectTo: 'app/patients', pathMatch: 'full' },
  { path: 'consultation', redirectTo: 'app/consultation', pathMatch: 'full' },
  { path: 'ask-ai', redirectTo: 'app/ask-ai', pathMatch: 'full' },
  { path: 'patient-record', redirectTo: 'app/patient-record', pathMatch: 'full' },
  { path: 'patient-visit-summary', redirectTo: 'app/patient-visit-summary', pathMatch: 'full' },
  { path: 'upsert-patient', redirectTo: 'app/upsert-patient', pathMatch: 'full' },
  { path: 'specializations', redirectTo: 'app/specializations', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
