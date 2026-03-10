import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { appRoutes } from './app.routes';
import { authReducer } from './auth/store/auth.reducer';
import { AuthEffects } from './auth/store/auth.effects';
import { servicesReducer } from './services/store/services.reducer';
import { ServicesEffects } from './services/store/services.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { APP_VERSION } from './core/tokens/app.tokens';
import { version } from '../../../../package.json';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideStore({ auth: authReducer, services: servicesReducer }),
    provideEffects([AuthEffects, ServicesEffects]),
    { provide: APP_VERSION, useValue: version },
  ],
};
