import { createAction, props } from '@ngrx/store';
import {
  CreateTemplateDto,
  InstallTemplateDto,
} from '@virtualservice/shared/dto';
import { ITemplateItem } from './templates.state';
import { IServiceItem } from '../../services/store/services.state';

export const loadTemplates = createAction('[Templates] Load');
export const loadTemplatesSuccess = createAction(
  '[Templates] Load Success',
  props<{ templates: ITemplateItem[] }>(),
);
export const loadTemplatesFailure = createAction(
  '[Templates] Load Failure',
  props<{ error: string }>(),
);

export const loadTemplate = createAction(
  '[Templates] Load One',
  props<{ id: string }>(),
);
export const loadTemplateSuccess = createAction(
  '[Templates] Load One Success',
  props<{ template: ITemplateItem }>(),
);
export const loadTemplateFailure = createAction(
  '[Templates] Load One Failure',
  props<{ error: string }>(),
);

export const createTemplate = createAction(
  '[Templates] Create',
  props<{ dto: CreateTemplateDto }>(),
);
export const createTemplateSuccess = createAction(
  '[Templates] Create Success',
  props<{ template: ITemplateItem }>(),
);
export const createTemplateFailure = createAction(
  '[Templates] Create Failure',
  props<{ error: string }>(),
);

export const deleteTemplate = createAction(
  '[Templates] Delete',
  props<{ id: string }>(),
);
export const deleteTemplateSuccess = createAction(
  '[Templates] Delete Success',
  props<{ id: string }>(),
);
export const deleteTemplateFailure = createAction(
  '[Templates] Delete Failure',
  props<{ error: string }>(),
);

export const installTemplate = createAction(
  '[Templates] Install',
  props<{ id: string; dto: InstallTemplateDto }>(),
);
export const installTemplateSuccess = createAction(
  '[Templates] Install Success',
  props<{ service: IServiceItem }>(),
);
export const installTemplateFailure = createAction(
  '[Templates] Install Failure',
  props<{ error: string }>(),
);
