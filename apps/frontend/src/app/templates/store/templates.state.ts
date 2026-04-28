import { ITemplate } from '@virtualservice/shared/model';

export type ITemplateItem = ITemplate & { _id: string };

export interface TemplatesState {
  items: ITemplateItem[];
  current: ITemplateItem | null;
  loading: boolean;
  saving: boolean;
  installing: boolean;
  error: string | null;
}

export const initialTemplatesState: TemplatesState = {
  items: [],
  current: null,
  loading: false,
  saving: false,
  installing: false,
  error: null,
};
