import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import * as EditorActions from './editor.actions';
import { EditorApiService } from '../editor-api.service';
import { selectEditorService } from './editor.selectors';

@Injectable()
export class EditorEffects {
  private actions$ = inject(Actions);
  private api = inject(EditorApiService);
  private store = inject(Store);

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
          catchError((err) =>
            of(
              EditorActions.saveEditorFailure({
                error: err.error?.message ?? 'Failed to save service',
              }),
            ),
          ),
        );
      }),
    ),
  );
}
