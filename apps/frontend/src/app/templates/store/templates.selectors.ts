import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TemplatesState } from './templates.state';

export const selectTemplatesState =
  createFeatureSelector<TemplatesState>('templates');

export const selectTemplates = createSelector(
  selectTemplatesState,
  (s) => s.items,
);
export const selectTemplate = createSelector(
  selectTemplatesState,
  (s) => s.current,
);
export const selectTemplatesLoading = createSelector(
  selectTemplatesState,
  (s) => s.loading,
);
export const selectTemplatesSaving = createSelector(
  selectTemplatesState,
  (s) => s.saving,
);
export const selectTemplatesInstalling = createSelector(
  selectTemplatesState,
  (s) => s.installing,
);
export const selectTemplatesError = createSelector(
  selectTemplatesState,
  (s) => s.error,
);
