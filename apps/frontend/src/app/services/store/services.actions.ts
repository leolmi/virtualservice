import { createAction, props } from '@ngrx/store';
import { IServiceItem } from './services.state';

export const loadServices = createAction('[Services] Load');
export const loadServicesSuccess = createAction(
  '[Services] Load Success',
  props<{ services: IServiceItem[] }>(),
);
export const loadServicesFailure = createAction(
  '[Services] Load Failure',
  props<{ error: string }>(),
);

export const saveService = createAction(
  '[Services] Save',
  props<{ service: IServiceItem }>(),
);
export const saveServiceSuccess = createAction(
  '[Services] Save Success',
  props<{ service: IServiceItem }>(),
);
export const saveServiceFailure = createAction(
  '[Services] Save Failure',
  props<{ error: string }>(),
);

export const deleteService = createAction(
  '[Services] Delete',
  props<{ id: string }>(),
);
export const deleteServiceSuccess = createAction(
  '[Services] Delete Success',
  props<{ id: string }>(),
);
export const deleteServiceFailure = createAction(
  '[Services] Delete Failure',
  props<{ error: string }>(),
);

export const createService = createAction('[Services] Create');
export const createServiceSuccess = createAction(
  '[Services] Create Success',
  props<{ service: IServiceItem }>(),
);
export const createServiceFailure = createAction(
  '[Services] Create Failure',
  props<{ error: string }>(),
);

export const importServices = createAction(
  '[Services] Import',
  props<{ services: Partial<IServiceItem>[] }>(),
);
export const importServicesSuccess = createAction(
  '[Services] Import Success',
  props<{ services: IServiceItem[] }>(),
);
export const importServicesFailure = createAction(
  '[Services] Import Failure',
  props<{ error: string }>(),
);
