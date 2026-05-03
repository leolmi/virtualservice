import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';

interface BodyParserError {
  statusCode?: number;
  status?: number;
  type?: string;
  length?: number;
  limit?: number;
  expected?: number;
}

/**
 * Intercetta gli errori `PayloadTooLarge` (status 413) emessi dai body-parser
 * (json/urlencoded) e dalle eccezioni HTTP equivalenti, sostituendo il
 * messaggio di default ("request entity too large") con uno informativo che
 * mostra la dimensione del payload ricevuto e il limite configurato:
 *
 *   "Request entity too large: passed 230 KB for a limit of 200 KB"
 *
 * Le altre eccezioni vengono delegate al filter di default di Nest.
 */
@Catch()
export class PayloadTooLargeFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PayloadTooLargeFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    const err = exception as BodyParserError;
    const status = err?.statusCode ?? err?.status;

    if (status !== HttpStatus.PAYLOAD_TOO_LARGE) {
      super.catch(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // `length` è la size effettivamente letta; se assente, usiamo `expected`
    // (Content-Length header) come ripiego.
    const received = err.length ?? err.expected;
    const limit = err.limit;

    const message =
      received !== undefined && limit !== undefined
        ? `Request entity too large: passed ${formatBytes(received)} for a limit of ${formatBytes(limit)}`
        : 'Request entity too large';

    this.logger.warn(message);

    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      error: 'Payload Too Large',
      message,
      ...(received !== undefined ? { received } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return `${bytes} B`;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
