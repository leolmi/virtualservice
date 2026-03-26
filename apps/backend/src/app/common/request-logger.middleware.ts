import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    res.on('finish', () => {
      const elapsed = Date.now() - start;
      const { statusCode } = res;
      const contentLength = res.get('content-length') ?? '-';

      // Colora in base allo status
      const statusTag =
        statusCode >= 500
          ? `\x1b[31m${statusCode}\x1b[0m`
          : statusCode >= 400
            ? `\x1b[33m${statusCode}\x1b[0m`
            : `\x1b[32m${statusCode}\x1b[0m`;

      const base = `${method} ${originalUrl} ${statusTag} ${contentLength}b ${elapsed}ms`;

      // Rotte /service/*: aggiungi dettagli di provenienza
      if (originalUrl.startsWith('/service/')) {
        const ua = req.get('user-agent') ?? '-';
        const origin = req.get('origin') ?? req.get('referer') ?? '-';
        const contentType = req.get('content-type') ?? '-';
        this.logger.log(`${base} — ${ip} | origin: ${origin} | ua: ${ua} | ct: ${contentType}`);
      } else {
        this.logger.log(`${base} — ${ip}`);
      }
    });

    next();
  }
}
