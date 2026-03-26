import { createReducer, on } from '@ngrx/store';
import { IServiceCall } from '@virtualservice/shared/model';
import { initialEditorState } from './editor.state';
import * as EditorActions from './editor.actions';

export const editorReducer = createReducer(
  initialEditorState,

  on(EditorActions.loadEditor, (state) => ({ ...state, loading: true, error: null })),
  on(EditorActions.loadEditorSuccess, (state, { service }) => ({
    ...state,
    service,
    loading: false,
    dirty: false,
    activeCallIndex: null,
  })),
  on(EditorActions.loadEditorFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(EditorActions.updateService, (state, { changes }) => ({
    ...state,
    service: state.service ? { ...state.service, ...changes } : null,
    dirty: true,
  })),

  on(EditorActions.selectCall, (state, { index }) => ({
    ...state,
    activeCallIndex: index,
  })),

  on(EditorActions.updateActiveCall, (state, { changes }) => {
    if (!state.service || state.activeCallIndex === null) return state;
    const idx = state.activeCallIndex;
    const calls = state.service.calls.map((c, i) =>
      i === idx ? { ...c, ...changes } : c,
    );
    return { ...state, service: { ...state.service, calls }, dirty: true };
  }),

  on(EditorActions.addCall, (state) => {
    if (!state.service) return state;
    const newCall: IServiceCall = {
      path: `call-${Date.now()}`,
      verb: 'GET',
      description: '',
      response: '',
      file: '',
      respType: 'json',
      rules: [],
      body: '',
      parameters: [],
      headers: {},
      cookies: {},
    };
    const calls = [...state.service.calls, newCall];
    return {
      ...state,
      service: { ...state.service, calls },
      activeCallIndex: calls.length - 1,
      dirty: true,
    };
  }),

  on(EditorActions.deleteActiveCall, (state) => {
    if (!state.service || state.activeCallIndex === null) return state;
    const idx = state.activeCallIndex;
    const calls = state.service.calls.filter((_, i) => i !== idx);
    return {
      ...state,
      service: { ...state.service, calls },
      activeCallIndex: null,
      dirty: true,
    };
  }),

  on(EditorActions.addRule, (state, { rule }) => {
    if (!state.service || state.activeCallIndex === null) return state;
    const idx = state.activeCallIndex;
    const call = state.service.calls[idx];
    const updatedCall = { ...call, rules: [...call.rules, rule] };
    const calls = state.service.calls.map((c, i) =>
      i === idx ? updatedCall : c,
    );
    return { ...state, service: { ...state.service, calls }, dirty: true };
  }),

  on(EditorActions.deleteRule, (state, { ruleIndex }) => {
    if (!state.service || state.activeCallIndex === null) return state;
    const idx = state.activeCallIndex;
    const call = state.service.calls[idx];
    const rules = call.rules.filter((_, i) => i !== ruleIndex);
    const updatedCall = { ...call, rules };
    const calls = state.service.calls.map((c, i) =>
      i === idx ? updatedCall : c,
    );
    return { ...state, service: { ...state.service, calls }, dirty: true };
  }),

  on(EditorActions.updateRule, (state, { ruleIndex, changes }) => {
    if (!state.service || state.activeCallIndex === null) return state;
    const idx = state.activeCallIndex;
    const call = state.service.calls[idx];
    const rules = call.rules.map((r, i) =>
      i === ruleIndex ? { ...r, ...changes } : r,
    );
    const updatedCall = { ...call, rules };
    const calls = state.service.calls.map((c, i) =>
      i === idx ? updatedCall : c,
    );
    return { ...state, service: { ...state.service, calls }, dirty: true };
  }),

  on(EditorActions.saveEditor, (state) => ({ ...state, saving: true })),
  on(EditorActions.saveEditorSuccess, (state, { service }) => ({
    ...state,
    service,
    saving: false,
    dirty: false,
  })),
  on(EditorActions.saveEditorFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(EditorActions.clearEditor, () => ({ ...initialEditorState })),
);
