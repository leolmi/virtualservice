import { DropFileType } from './drop-file-types';

export const APP_NAME = 'Virtual Service';

export const PARAM_TARGET_PATH = 'path';
export const PARAM_TARGET_QUERY = 'query';

export const DROP_FILE_TYPES: DropFileType[] = [
  { description: 'VirtualService', extensions: '*.json' },
  { description: 'OpenAPI / Swagger', extensions: '*.json' },
  { description: 'Postman Collection v2', extensions: '*.json' },
  { description: 'Insomnia v4', extensions: '*.json' },
  { description: 'HAR (HTTP Archive)', extensions: '*.har' },
  { description: 'cURL', extensions: '*.txt, *.curl, *.sh' },
];
