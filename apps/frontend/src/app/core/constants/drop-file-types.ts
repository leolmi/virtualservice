export interface DropFileType {
  description: string;
  extensions: string;
}

export const DROP_FILE_TYPES: DropFileType[] = [
  { description: 'curl text file (bash style)', extensions: '*.txt, *.curl' },
  { description: 'chrome log (.har)', extensions: '*.har' },
  { description: 'swagger (SOA 2.0)', extensions: '*.json, *.yml' },
  { description: 'postman (collection v2)', extensions: '*.json, *.yml' },
];
