import { createAction, props } from '@ngrx/store';
import { IServiceItem } from '../../services/store/services.state';
import { IServiceCall, IServiceCallRule } from '@virtualservice/shared/model';

export const loadEditor = createAction('[Editor] Load', props<{ id: string }>());
export const loadEditorSuccess = createAction(
  '[Editor] Load Success',
  props<{ service: IServiceItem }>(),
);
export const loadEditorFailure = createAction(
  '[Editor] Load Failure',
  props<{ error: string }>(),
);

export const updateService = createAction(
  '[Editor] Update Service',
  props<{ changes: Partial<IServiceItem> }>(),
);

export const selectCall = createAction(
  '[Editor] Select Call',
  props<{ index: number | null }>(),
);

export const updateActiveCall = createAction(
  '[Editor] Update Active Call',
  props<{ changes: Partial<IServiceCall> }>(),
);

export const addCall = createAction('[Editor] Add Call');
export const deleteActiveCall = createAction('[Editor] Delete Active Call');

export const addRule = createAction(
  '[Editor] Add Rule',
  props<{ rule: IServiceCallRule }>(),
);
export const deleteRule = createAction(
  '[Editor] Delete Rule',
  props<{ ruleIndex: number }>(),
);
export const updateRule = createAction(
  '[Editor] Update Rule',
  props<{ ruleIndex: number; changes: Partial<IServiceCallRule> }>(),
);

export const saveEditor = createAction('[Editor] Save');
export const saveEditorSuccess = createAction(
  '[Editor] Save Success',
  props<{ service: IServiceItem }>(),
);
export const saveEditorFailure = createAction(
  '[Editor] Save Failure',
  props<{ error: string }>(),
);

export const clearEditor = createAction('[Editor] Clear');
