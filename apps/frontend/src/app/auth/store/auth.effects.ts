import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Router } from '@angular/router';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as AuthActions from './auth.actions';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthEffects implements OnInitEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  /** On NgRx init, dispatch restoreSession to rehydrate auth from localStorage */
  ngrxOnInitEffects(): Action {
    return AuthActions.restoreSession();
  }

  restoreSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreSession),
      switchMap(() => {
        const session = this.authService.restoreSession();
        if (!session) {
          return of(AuthActions.restoreSessionFailure());
        }
        // Validate the token is still valid by calling /auth/me
        return this.authService.getMe(session.token).pipe(
          map((user) =>
            AuthActions.restoreSessionSuccess({ token: session.token, user }),
          ),
          catchError(() => {
            this.authService.clearSession();
            return of(AuthActions.restoreSessionFailure());
          }),
        );
      }),
    ),
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map((response) => AuthActions.loginSuccess(response)),
          catchError((err) =>
            of(
              AuthActions.loginFailure({
                error: err.error?.message ?? 'Login failed',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ token, user }) => {
          this.authService.saveSession(token, user);
          this.router.navigate(['/services']);
        }),
      ),
    { dispatch: false },
  );

  loginWithGoogle$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginWithGoogle),
        tap(() => {
          window.location.href = '/api/auth/google';
        }),
      ),
    { dispatch: false },
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authService.clearSession();
          this.router.navigate(['/login']);
        }),
      ),
    { dispatch: false },
  );
}
