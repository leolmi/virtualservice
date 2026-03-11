import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EditorState } from './editor.state';

export const selectEditorState = createFeatureSelector<EditorState>('editor');

export const selectEditorService = createSelector(
  selectEditorState,
  (s) => s.service,
);
export const selectEditorActiveCallIndex = createSelector(
  selectEditorState,
  (s) => s.activeCallIndex,
);
export const selectEditorDirty = createSelector(
  selectEditorState,
  (s) => s.dirty,
);
export const selectEditorLoading = createSelector(
  selectEditorState,
  (s) => s.loading,
);
export const selectEditorSaving = createSelector(
  selectEditorState,
  (s) => s.saving,
);
export const selectEditorError = createSelector(
  selectEditorState,
  (s) => s.error,
);

export const selectEditorActiveCall = createSelector(
  selectEditorService,
  selectEditorActiveCallIndex,
  (svc, idx) => (svc && idx !== null ? (svc.calls[idx] ?? null) : null),
);
