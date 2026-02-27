import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AuthPageComponent } from './pages/auth/auth-page.component';
import { AppShellComponent } from './layout/app-shell.component';
import { TemplatesPageComponent } from './pages/templates/templates-page.component';

export const routes: Routes = [
  { path: 'auth', component: AuthPageComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'templates', component: TemplatesPageComponent },
      { path: '', pathMatch: 'full', redirectTo: 'templates' }
    ]
  },
  { path: '**', redirectTo: '' }
];
