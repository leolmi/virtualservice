import { DropFileType } from './drop-file-types';

export const APP_NAME = 'Virtual Service';

export const PARAM_TARGET_PATH = 'path';
export const PARAM_TARGET_QUERY = 'query';

export const DROP_FILE_TYPES: DropFileType[] = [
  { description: 'OpenApi / Swagger (SOA 2.0)', extensions: '*.json, *.yml' },
  { description: 'Curl text file (bash style)', extensions: '*.txt, *.curl' },
  { description: 'Postman (collection v2)', extensions: '*.json, *.yml' },
  { description: 'Chrome log (.har)', extensions: '*.har' },
];
