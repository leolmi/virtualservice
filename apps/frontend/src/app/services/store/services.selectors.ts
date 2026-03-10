import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ServicesState } from './services.state';

export const selectServicesState =
  createFeatureSelector<ServicesState>('services');

export const selectServices = createSelector(
  selectServicesState,
  (s) => s.items,
);
export const selectServicesLoading = createSelector(
  selectServicesState,
  (s) => s.loading,
);
export const selectServicesSaving = createSelector(
  selectServicesState,
  (s) => s.saving,
);
export const selectServicesError = createSelector(
  selectServicesState,
  (s) => s.error,
);

export const selectStarredServices = createSelector(selectServices, (items) =>
  items.filter((s) => s.starred),
);
export const selectOtherServices = createSelector(selectServices, (items) =>
  items.filter((s) => !s.starred),
);
