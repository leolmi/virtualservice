import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import {
  selectIsLoggedIn,
  selectSessionRestored,
  selectUser,
} from '../../auth/store/auth.selectors';

/**
 * Guard che consente l'accesso solo agli utenti autenticati con ruolo 'admin'.
 * Se non autenticato → redirect a /login.
 * Se autenticato ma non admin → redirect a /services.
 */
export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectSessionRestored).pipe(
    filter((restored) => restored),
    take(1),
    switchMap(() =>
      store.select(selectIsLoggedIn).pipe(
        take(1),
        switchMap((isLoggedIn) => {
          if (!isLoggedIn) {
            return [router.createUrlTree(['/login'])];
          }
          return store.select(selectUser).pipe(
            take(1),
            map((user) =>
              user?.role === 'admin'
                ? true
                : router.createUrlTree(['/services']),
            ),
          );
        }),
      ),
    ),
  );
};
