import { IServiceItem } from '../../services/store/services.state';

export interface EditorState {
  service: IServiceItem | null;
  activeCallIndex: number | null;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialEditorState: EditorState = {
  service: null,
  activeCallIndex: null,
  dirty: false,
  loading: false,
  saving: false,
  error: null,
};
