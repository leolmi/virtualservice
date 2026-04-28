import { createAction, props } from '@ngrx/store';
import {
  IApiKeyPublic,
  IGeneratedApiKey,
} from '@virtualservice/shared/model';

export const loadApiKeys = createAction('[ApiKeys] Load');
export const loadApiKeysSuccess = createAction(
  '[ApiKeys] Load Success',
  props<{ keys: IApiKeyPublic[] }>(),
);
export const loadApiKeysFailure = createAction(
  '[ApiKeys] Load Failure',
  props<{ error: string }>(),
);

export const generateApiKey = createAction(
  '[ApiKeys] Generate',
  props<{ name: string }>(),
);
export const generateApiKeySuccess = createAction(
  '[ApiKeys] Generate Success',
  props<{ key: IGeneratedApiKey }>(),
);
export const generateApiKeyFailure = createAction(
  '[ApiKeys] Generate Failure',
  props<{ error: string }>(),
);

/** Cancella il segreto in chiaro dallo store (chiusura dialog). */
export const clearGeneratedSecret = createAction(
  '[ApiKeys] Clear Generated Secret',
);

export const revokeApiKey = createAction(
  '[ApiKeys] Revoke',
  props<{ id: string }>(),
);
export const revokeApiKeySuccess = createAction(
  '[ApiKeys] Revoke Success',
  props<{ id: string }>(),
);
export const revokeApiKeyFailure = createAction(
  '[ApiKeys] Revoke Failure',
  props<{ error: string }>(),
);
