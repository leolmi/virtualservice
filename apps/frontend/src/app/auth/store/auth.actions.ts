import { createAction, props } from '@ngrx/store';
import { IUser } from '@virtualservice/shared/model';

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>(),
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ token: string; user: IUser }>(),
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>(),
);

export const loginWithGoogle = createAction('[Auth] Login With Google');

export const logout = createAction('[Auth] Logout');

export const restoreSession = createAction('[Auth] Restore Session');

export const restoreSessionSuccess = createAction(
  '[Auth] Restore Session Success',
  props<{ token: string; user: IUser }>(),
);

export const restoreSessionFailure = createAction(
  '[Auth] Restore Session Failure',
);
