import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { token, user }) => ({
    ...state,
    loading: false,
    token,
    user,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.restoreSessionSuccess, (state, { token, user }) => ({
    ...state,
    token,
    user,
    sessionRestored: true,
  })),
  on(AuthActions.restoreSessionFailure, (state) => ({
    ...state,
    token: null,
    user: null,
    sessionRestored: true,
  })),
  on(AuthActions.logout, () => initialAuthState),
);
