import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    title: '',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./auth/google-callback/google-callback.component').then(
        (m) => m.GoogleCallbackComponent,
      ),
  },
  {
    path: 'help',
    title: 'help',
    loadComponent: () =>
      import('./help/help.component').then((m) => m.HelpComponent),
  },
  {
    path: 'legal',
    title: 'legal',
    loadComponent: () =>
      import('./legal/legal.component').then((m) => m.LegalComponent),
  },
  {
    path: 'services',
    title: 'services',
    data: { helpContext: 'services' },
    canActivate: [authGuard],
    loadComponent: () =>
      import('./services/services.component').then((m) => m.ServicesComponent),
  },
  {
    path: 'editor/:id',
    title: 'editor',
    data: { helpContext: 'editor' },
    canActivate: [authGuard],
    loadComponent: () =>
      import('./editor/editor.component').then((m) => m.EditorComponent),
    children: [
      {
        path: 'call',
        title: 'editor call',
        data: { helpContext: 'editor-call' },
        loadComponent: () =>
          import('./editor/call/call.component').then((m) => m.CallComponent),
      },
      {
        path: 'test',
        title: 'editor test',
        data: { helpContext: 'editor-test' },
        loadComponent: () =>
          import('./editor/test/test.component').then((m) => m.TestComponent),
      },
      {
        path: 'database',
        title: 'editor database',
        data: { helpContext: 'editor-database' },
        loadComponent: () =>
          import('./editor/database/database.component').then(
            (m) => m.DatabaseComponent,
          ),
      },
      {
        path: 'function',
        title: 'editor function',
        data: { helpContext: 'timed-function' },
        loadComponent: () =>
          import('./editor/function/function.component').then(
            (m) => m.FunctionComponent,
          ),
      },
      { path: '', redirectTo: 'call', pathMatch: 'full' },
    ],
  },
  {
    path: 'monitor/:id',
    title: 'monitor',
    data: { helpContext: 'monitor' },
    canActivate: [authGuard],
    loadComponent: () =>
      import('./monitor/monitor.component').then((m) => m.MonitorComponent),
  },
  {
    path: 'management',
    title: 'management',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./management/management.component').then(
        (m) => m.ManagementComponent,
      ),
  },
];
