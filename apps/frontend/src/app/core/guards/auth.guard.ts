import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import {
  selectIsLoggedIn,
  selectSessionRestored,
} from '../../auth/store/auth.selectors';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  // Wait until the session restore attempt has completed before checking auth
  return store.select(selectSessionRestored).pipe(
    filter((restored) => restored),
    take(1),
    switchMap(() =>
      store.select(selectIsLoggedIn).pipe(
        take(1),
        map((isLoggedIn) =>
          isLoggedIn ? true : router.createUrlTree(['/login']),
        ),
      ),
    ),
  );
};
