import { createReducer, on } from '@ngrx/store';
import * as ServicesActions from './services.actions';
import { initialServicesState } from './services.state';

export const servicesReducer = createReducer(
  initialServicesState,

  on(ServicesActions.loadServices, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ServicesActions.loadServicesSuccess, (state, { services }) => ({
    ...state,
    loading: false,
    items: services,
  })),
  on(ServicesActions.loadServicesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(ServicesActions.saveService, (state) => ({
    ...state,
    saving: true,
  })),
  on(ServicesActions.saveServiceSuccess, (state, { service }) => ({
    ...state,
    saving: false,
    items: state.items.map((i) => (i._id === service._id ? service : i)),
  })),
  on(ServicesActions.saveServiceFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),

  on(ServicesActions.deleteServiceSuccess, (state, { id }) => ({
    ...state,
    items: state.items.filter((i) => i._id !== id),
  })),

  on(ServicesActions.createServiceSuccess, (state, { service }) => ({
    ...state,
    items: [...state.items, service],
  })),

  on(ServicesActions.importServices, (state) => ({
    ...state,
    saving: true,
    error: null,
  })),
  on(ServicesActions.importServicesSuccess, (state, { services }) => ({
    ...state,
    saving: false,
    items: [...state.items, ...services],
  })),
  on(ServicesActions.importServicesFailure, (state, { error }) => ({
    ...state,
    saving: false,
    error,
  })),
);
