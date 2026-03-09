import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { appRoutes } from './app.routes';
import { authReducer } from './auth/store/auth.reducer';
import { AuthEffects } from './auth/store/auth.effects';
import { APP_VERSION } from './core/tokens/app.tokens';
import { version } from '../../../../package.json';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects]),
    { provide: APP_VERSION, useValue: version },
  ],
};
