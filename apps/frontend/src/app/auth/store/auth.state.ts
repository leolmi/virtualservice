import { IUser } from '@virtualservice/shared/model';

export interface AuthState {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  /** True once the session restore attempt has completed (success or failure) */
  sessionRestored: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  sessionRestored: false,
};
