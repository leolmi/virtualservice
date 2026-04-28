import { createReducer, on } from '@ngrx/store';
import * as ApiKeysActions from './api-keys.actions';
import { initialApiKeysState } from './api-keys.state';

export const apiKeysReducer = createReducer(
  initialApiKeysState,

  on(ApiKeysActions.loadApiKeys, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ApiKeysActions.loadApiKeysSuccess, (state, { keys }) => ({
    ...state,
    loading: false,
    items: keys,
  })),
  on(ApiKeysActions.loadApiKeysFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(ApiKeysActions.generateApiKey, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(ApiKeysActions.generateApiKeySuccess, (state, { key }) => {
    const { secret, ...publicView } = key;
    return {
      ...state,
      saving: false,
      items: [publicView, ...state.items],
      lastGeneratedSecret: secret,
    };
  }),
  on(ApiKeysActions.generateApiKeyFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),
  on(ApiKeysActions.clearGeneratedSecret, (state) => ({
    ...state,
    lastGeneratedSecret: null,
  })),

  on(ApiKeysActions.revokeApiKeySuccess, (state, { id }) => ({
    ...state,
    items: state.items.map((k) =>
      k._id === id ? { ...k, revokedAt: new Date() } : k,
    ),
  })),
  on(ApiKeysActions.revokeApiKeyFailure, (state, { error }) => ({
    ...state,
    error,
  })),
);
