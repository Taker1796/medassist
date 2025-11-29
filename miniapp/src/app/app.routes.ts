import { Routes } from '@angular/router';
import {Dialogs} from './dialogs/dialogs';
import {Main} from './main/main';
import {Doctor} from './doctor/doctor';

export const routes: Routes = [
  { path: '', component: Main },  // Главная страница
  { path: 'dialogs', component: Dialogs },
  { path: 'doctor', component: Doctor }];
