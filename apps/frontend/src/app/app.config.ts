import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withInMemoryScrolling, withRouterConfig,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { appRoutes } from './app.routes';
import { authReducer } from './auth/store/auth.reducer';
import { AuthEffects } from './auth/store/auth.effects';
import { servicesReducer } from './services/store/services.reducer';
import { ServicesEffects } from './services/store/services.effects';
import { editorReducer } from './editor/store/editor.reducer';
import { EditorEffects } from './editor/store/editor.effects';
import { templatesReducer } from './templates/store/templates.reducer';
import { TemplatesEffects } from './templates/store/templates.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { APP_VERSION } from './core/tokens/app.tokens';
import { AppTitleStrategy } from './core/services/app-title.strategy';
import { version } from '../../../../package.json';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withRouterConfig({
        paramsInheritanceStrategy: 'always'
      }),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideStore({
      auth: authReducer,
      services: servicesReducer,
      editor: editorReducer,
      templates: templatesReducer,
    }),
    provideEffects([AuthEffects, ServicesEffects, EditorEffects, TemplatesEffects]),
    { provide: APP_VERSION, useValue: version },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
