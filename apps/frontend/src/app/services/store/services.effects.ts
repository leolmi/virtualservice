import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, map, switchMap, tap, mergeMap, toArray } from 'rxjs/operators';
import { of, from } from 'rxjs';
import * as ServicesActions from './services.actions';
import { ServicesApiService } from '../services.service';

@Injectable()
export class ServicesEffects {
  private actions$ = inject(Actions);
  private api = inject(ServicesApiService);
  private router = inject(Router);

  loadServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.loadServices),
      switchMap(() =>
        this.api.getAll().pipe(
          map((services) => ServicesActions.loadServicesSuccess({ services })),
          catchError((err) =>
            of(
              ServicesActions.loadServicesFailure({
                error: err.error?.message ?? 'Failed to load services',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  saveService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.saveService),
      switchMap(({ service }) =>
        this.api.save(service).pipe(
          map((saved) => ServicesActions.saveServiceSuccess({ service: saved })),
          catchError((err) =>
            of(
              ServicesActions.saveServiceFailure({
                error: err.error?.message ?? 'Failed to save service',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.deleteService),
      switchMap(({ id }) =>
        this.api.delete(id).pipe(
          map(() => ServicesActions.deleteServiceSuccess({ id })),
          catchError((err) =>
            of(
              ServicesActions.deleteServiceFailure({
                error: err.error?.message ?? 'Failed to delete service',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.createService),
      switchMap(() => {
        const now = Date.now();
        const newService = {
          name: 'New Service',
          description: '',
          active: false,
          starred: false,
          path: `new-service-${now}`,
          calls: [],
          dbo: '',
          schedulerFn: '',
          interval: 0,
          lastChange: now,
          creationDate: now,
        };
        return this.api.save(newService).pipe(
          map((saved) => ServicesActions.createServiceSuccess({ service: saved })),
          catchError((err) =>
            of(
              ServicesActions.createServiceFailure({
                error: err.error?.message ?? 'Failed to create service',
              }),
            ),
          ),
        );
      }),
    ),
  );

  createServiceSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ServicesActions.createServiceSuccess),
        tap(({ service }) =>
          this.router.navigate(['/editor', service._id, 'call']),
        ),
      ),
    { dispatch: false },
  );

  importServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ServicesActions.importServices),
      switchMap(({ services }) =>
        from(services).pipe(
          mergeMap((svc) => this.api.save(svc), 3),
          toArray(),
          map((saved) => ServicesActions.importServicesSuccess({ services: saved })),
          catchError((err) =>
            of(
              ServicesActions.importServicesFailure({
                error: err.error?.message ?? 'Failed to import services',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
