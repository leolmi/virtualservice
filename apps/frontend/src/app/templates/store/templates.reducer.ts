import { createReducer, on } from '@ngrx/store';
import * as TemplatesActions from './templates.actions';
import { initialTemplatesState } from './templates.state';

export const templatesReducer = createReducer(
  initialTemplatesState,

  on(TemplatesActions.loadTemplates, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TemplatesActions.loadTemplatesSuccess, (state, { templates }) => ({
    ...state,
    loading: false,
    items: templates,
  })),
  on(TemplatesActions.loadTemplatesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TemplatesActions.loadTemplate, (state) => ({
    ...state,
    loading: true,
    current: null,
    error: null,
  })),
  on(TemplatesActions.loadTemplateSuccess, (state, { template }) => ({
    ...state,
    loading: false,
    current: template,
  })),
  on(TemplatesActions.loadTemplateFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TemplatesActions.createTemplate, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(TemplatesActions.createTemplateSuccess, (state, { template }) => ({
    ...state,
    saving: false,
    items: [template, ...state.items],
  })),
  on(TemplatesActions.createTemplateFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(TemplatesActions.deleteTemplateSuccess, (state, { id }) => ({
    ...state,
    items: state.items.filter((t) => t._id !== id),
  })),
  on(TemplatesActions.deleteTemplateFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(TemplatesActions.installTemplate, (state) => ({
    ...state,
    installing: true,
    error: null,
  })),
  on(TemplatesActions.installTemplateSuccess, (state) => ({
    ...state,
    installing: false,
  })),
  on(TemplatesActions.installTemplateFailure, (state, { error }) => ({
    ...state,
    installing: false,
    error,
  })),
);
