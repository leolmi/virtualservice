import { IService } from '@virtualservice/shared/model';

export type IServiceItem = IService & { _id: string };

export interface ServicesState {
  items: IServiceItem[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialServicesState: ServicesState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
};
