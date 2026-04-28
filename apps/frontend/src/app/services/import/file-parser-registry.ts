import {
  FileParser,
  OpenApiParser,
  ParsedImport,
} from '@virtualservice/shared/utils';
import { VirtualServiceParser } from './parsers/virtualservice.parser';
import { PostmanParser } from './parsers/postman.parser';
import { InsomniaParser } from './parsers/insomnia.parser';
import { HarParser } from './parsers/har.parser';
import { CurlParser } from './parsers/curl.parser';

/**
 * Registry of all available file parsers.
 *
 * On drop, the registry iterates the parsers in order and uses
 * the first one whose `canParse()` returns true.
 * To add a new format, implement `FileParser` and register it here.
 *
 * ORDER MATTERS: more specific detectors first.
 * VirtualService is first (own format). Then Postman, Insomnia, OpenAPI
 * (all share .json — their canParse checks internal structure).
 * Curl is last because its canParse is text-based and less selective.
 */

const PARSERS: FileParser[] = [
  new VirtualServiceParser(),
  new PostmanParser(),
  new InsomniaParser(),
  new OpenApiParser(),
  new HarParser(),
  new CurlParser(),
];

export interface ParseResult {
  parserId: string;
  parserLabel: string;
  data: ParsedImport;
}

/**
 * Try every registered parser in order.
 * Returns the result from the first parser that recognises the file.
 * Throws a user-friendly error if no parser matches or parsing fails.
 */
export function parseImportFile(content: string, filename: string): ParseResult {
  for (const parser of PARSERS) {
    if (parser.canParse(content, filename)) {
      return {
        parserId: parser.id,
        parserLabel: parser.label,
        data: parser.parse(content),
      };
    }
  }

  const supported = PARSERS.map((p) => p.label).join(', ');
  throw new Error(
    `Unrecognised file format. Supported formats: ${supported}.`,
  );
}
