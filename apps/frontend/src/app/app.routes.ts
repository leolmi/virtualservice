import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'services',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./services/services.component').then((m) => m.ServicesComponent),
  },
  // { path: 'editor/:id/:page', loadComponent: () => import('./editor/editor.component').then(m => m.EditorComponent), canActivate: [authGuard] },
  // { path: 'monitor/:id', loadComponent: () => import('./monitor/monitor.component').then(m => m.MonitorComponent), canActivate: [authGuard] },
];
