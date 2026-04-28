import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApiKeysState } from './api-keys.state';

export const selectApiKeysState =
  createFeatureSelector<ApiKeysState>('apiKeys');

export const selectApiKeys = createSelector(
  selectApiKeysState,
  (s) => s.items,
);
export const selectApiKeysLoading = createSelector(
  selectApiKeysState,
  (s) => s.loading,
);
export const selectApiKeysSaving = createSelector(
  selectApiKeysState,
  (s) => s.saving,
);
export const selectApiKeysError = createSelector(
  selectApiKeysState,
  (s) => s.error,
);
export const selectLastGeneratedSecret = createSelector(
  selectApiKeysState,
  (s) => s.lastGeneratedSecret,
);
