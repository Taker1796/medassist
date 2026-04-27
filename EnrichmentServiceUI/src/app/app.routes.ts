import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AuthPageComponent } from './pages/auth/auth-page.component';
import { AppShellComponent } from './layout/app-shell.component';
import { TemplatesPageComponent } from './pages/templates/templates-page.component';
import { DevEnrichmentLogsPageComponent } from './pages/dev-enrichment-logs/dev-enrichment-logs-page.component';
import { SettingsPageComponent } from './pages/settings/settings-page.component';
import { Environment } from './environments/environment';

export const routes: Routes = [
  { path: 'auth', component: AuthPageComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'templates', component: TemplatesPageComponent },
      { path: 'settings', component: SettingsPageComponent },
      ...(Environment.devDiagnosticsEnabled
        ? [{ path: 'dev-enrichment-logs', component: DevEnrichmentLogsPageComponent }]
        : []),
      { path: '', pathMatch: 'full', redirectTo: 'templates' }
    ]
  },
  { path: '**', redirectTo: '' }
];
