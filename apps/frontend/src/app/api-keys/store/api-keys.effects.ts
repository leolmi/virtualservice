import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as ApiKeysActions from './api-keys.actions';
import { ApiKeysApiService } from '../api-keys.service';

@Injectable()
export class ApiKeysEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiKeysApiService);

  loadApiKeys$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApiKeysActions.loadApiKeys),
      switchMap(() =>
        this.api.list().pipe(
          map((keys) => ApiKeysActions.loadApiKeysSuccess({ keys })),
          catchError((err) =>
            of(
              ApiKeysActions.loadApiKeysFailure({
                error: err.error?.message ?? 'Failed to load API keys',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  generateApiKey$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApiKeysActions.generateApiKey),
      switchMap(({ name }) =>
        this.api.generate({ name }).pipe(
          map((key) => ApiKeysActions.generateApiKeySuccess({ key })),
          catchError((err) =>
            of(
              ApiKeysActions.generateApiKeyFailure({
                error: err.error?.message ?? 'Failed to generate API key',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  revokeApiKey$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApiKeysActions.revokeApiKey),
      switchMap(({ id }) =>
        this.api.revoke(id).pipe(
          map(() => ApiKeysActions.revokeApiKeySuccess({ id })),
          catchError((err) =>
            of(
              ApiKeysActions.revokeApiKeyFailure({
                error: err.error?.message ?? 'Failed to revoke API key',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
