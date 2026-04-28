import { IApiKeyPublic } from '@virtualservice/shared/model';

export interface ApiKeysState {
  items: IApiKeyPublic[];
  loading: boolean;
  saving: boolean;
  /**
   * Segreto in chiaro dell'ultima key generata. Mostrato in dialog dopo la
   * generazione e poi azzerato. Nessuna persistenza.
   */
  lastGeneratedSecret: string | null;
  error: string | null;
}

export const initialApiKeysState: ApiKeysState = {
  items: [],
  loading: false,
  saving: false,
  lastGeneratedSecret: null,
  error: null,
};
