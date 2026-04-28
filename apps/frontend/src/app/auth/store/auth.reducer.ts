import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { token, user, mcpEnabled }) => ({
    ...state,
    loading: false,
    token,
    user,
    mcpEnabled,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthActions.restoreSessionSuccess, (state, { token, user, mcpEnabled }) => ({
    ...state,
    token,
    user,
    mcpEnabled,
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
