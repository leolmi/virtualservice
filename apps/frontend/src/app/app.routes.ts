import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  // { path: 'services', loadComponent: () => import('./services/services.component').then(m => m.ServicesComponent) },
  // { path: 'editor/:id/:page', loadComponent: () => import('./editor/editor.component').then(m => m.EditorComponent) },
  // { path: 'monitor/:id', loadComponent: () => import('./monitor/monitor.component').then(m => m.MonitorComponent) },
];
