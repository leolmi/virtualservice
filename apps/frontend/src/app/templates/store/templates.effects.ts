import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as TemplatesActions from './templates.actions';
import * as ServicesActions from '../../services/store/services.actions';
import { TemplatesApiService } from '../templates.service';

@Injectable()
export class TemplatesEffects {
  private actions$ = inject(Actions);
  private api = inject(TemplatesApiService);
  private router = inject(Router);

  loadTemplates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplatesActions.loadTemplates),
      switchMap(() =>
        this.api.getAll().pipe(
          map((templates) =>
            TemplatesActions.loadTemplatesSuccess({ templates }),
          ),
          catchError((err) =>
            of(
              TemplatesActions.loadTemplatesFailure({
                error: err.error?.message ?? 'Failed to load templates',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplatesActions.loadTemplate),
      switchMap(({ id }) =>
        this.api.getOne(id).pipe(
          map((template) =>
            TemplatesActions.loadTemplateSuccess({ template }),
          ),
          catchError((err) =>
            of(
              TemplatesActions.loadTemplateFailure({
                error: err.error?.message ?? 'Failed to load template',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplatesActions.createTemplate),
      switchMap(({ dto }) =>
        this.api.create(dto).pipe(
          map((template) =>
            TemplatesActions.createTemplateSuccess({ template }),
          ),
          catchError((err) =>
            of(
              TemplatesActions.createTemplateFailure({
                error: err.error?.message ?? 'Failed to create template',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplatesActions.deleteTemplate),
      switchMap(({ id }) =>
        this.api.delete(id).pipe(
          map(() => TemplatesActions.deleteTemplateSuccess({ id })),
          catchError((err) =>
            of(
              TemplatesActions.deleteTemplateFailure({
                error: err.error?.message ?? 'Failed to delete template',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  installTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplatesActions.installTemplate),
      switchMap(({ id, dto }) =>
        this.api.install(id, dto).pipe(
          map((service) =>
            TemplatesActions.installTemplateSuccess({ service }),
          ),
          catchError((err) =>
            of(
              TemplatesActions.installTemplateFailure({
                error: err.error?.message ?? 'Failed to install template',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * Dopo l'install, aggiunge il nuovo servizio allo store services e
   * naviga all'editor del servizio appena creato.
   */
  installTemplateSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplatesActions.installTemplateSuccess),
      tap(({ service }) =>
        this.router.navigate(['/editor', service._id, 'call']),
      ),
      map(({ service }) =>
        ServicesActions.createServiceSuccess({ service }),
      ),
    ),
  );
}
