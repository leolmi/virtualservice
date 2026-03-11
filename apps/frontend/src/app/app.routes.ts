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
  {
    path: 'help',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./help/help.component').then((m) => m.HelpComponent),
  },
  {
    path: 'editor/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./editor/editor.component').then((m) => m.EditorComponent),
    children: [
      {
        path: 'call',
        loadComponent: () =>
          import('./editor/call/call.component').then((m) => m.CallComponent),
      },
      {
        path: 'test',
        loadComponent: () =>
          import('./editor/test/test.component').then((m) => m.TestComponent),
      },
      {
        path: 'database',
        loadComponent: () =>
          import('./editor/database/database.component').then(
            (m) => m.DatabaseComponent,
          ),
      },
      {
        path: 'function',
        loadComponent: () =>
          import('./editor/function/function.component').then(
            (m) => m.FunctionComponent,
          ),
      },
      { path: '', redirectTo: 'call', pathMatch: 'full' },
    ],
  },
  // { path: 'monitor/:id', loadComponent: () => import('./monitor/monitor.component').then(m => m.MonitorComponent), canActivate: [authGuard] },
];
