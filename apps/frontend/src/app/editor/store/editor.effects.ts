import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import * as EditorActions from './editor.actions';
import { EditorApiService } from '../editor-api.service';
import { selectEditorService } from './editor.selectors';

@Injectable()
export class EditorEffects {
  private actions$ = inject(Actions);
  private api = inject(EditorApiService);
  private store = inject(Store);
  private snackBar = inject(MatSnackBar);

  loadEditor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EditorActions.loadEditor),
      switchMap(({ id }) =>
        this.api.getById(id).pipe(
          map((service) => EditorActions.loadEditorSuccess({ service })),
          catchError((err) =>
            of(
              EditorActions.loadEditorFailure({
                error: err.error?.message ?? 'Failed to load service',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  saveEditor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EditorActions.saveEditor),
      withLatestFrom(this.store.select(selectEditorService)),
      switchMap(([, service]) => {
        if (!service) {
          return of(
            EditorActions.saveEditorFailure({ error: 'No service loaded' }),
          );
        }
        return this.api.save(service).pipe(
          map((saved) => EditorActions.saveEditorSuccess({ service: saved })),
          catchError((err) => {
            const message =
              err.error?.message ??
              (err.status === 413
                ? 'Payload too large — reduce service size'
                : `Failed to save service (${err.status})`);
            return of(EditorActions.saveEditorFailure({ error: message }));
          }),
        );
      }),
    ),
  );

  showSaveOrLoadError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          EditorActions.saveEditorFailure,
          EditorActions.loadEditorFailure,
        ),
        tap(({ error }) => {
          this.snackBar.open(error, 'Close', {
            duration: 6000,
            panelClass: 'snack-error',
          });
        }),
      ),
    { dispatch: false },
  );

  showSaveSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(EditorActions.saveEditorSuccess),
        tap(() => {
          this.snackBar.open('Service saved successfully', 'Close', {
            duration: 3000,
            panelClass: 'snack-success',
          });
        }),
      ),
    { dispatch: false },
  );
}
