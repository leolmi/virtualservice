import { InjectionToken } from '@angular/core';

/** Versione dell'applicazione letta dal package.json a build time */
export const APP_VERSION = new InjectionToken<string>('APP_VERSION');
