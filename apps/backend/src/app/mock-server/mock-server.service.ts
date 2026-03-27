import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { IServiceCall } from '@virtualservice/shared/model';
import {
  Service,
  ServiceDocument,
} from '../services/schemas/service.schema';
import { ServiceCacheService } from './service-cache.service';
import { LogService } from '../services/log.service';
import { findBestMatch, findAnyMatchByPath } from './utils/path-matcher.util';
import { buildScope, buildRuleScope } from './utils/scope-builder.util';
import { CalcResult } from './interfaces/scope.interface';
import calc from './workers/calc';

/** Regex da server.md: cattura tutto dopo /service/ */
const SERVICE_PATH_RE = /^[^?]*\/service\/([^/?]+)\/?(.*?)(?:\?.*)?$/;

/** Cartella degli asset per il file download */
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');

// Campi header da includere nel log della request
const LOGGED_HEADERS = [
  'content-type',
  'accept',
  'origin',
  'user-agent',
  'referer',
];

@Injectable()
export class MockServerService {
  private readonly logger = new Logger(MockServerService.name);

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly cacheService: ServiceCacheService,
    private readonly logService: LogService,
  ) {}

  async handleRequest(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    // Snapshot della request per il log
    const requestInfo = this.buildRequestInfo(req);

    // Helper: invia risposta, salva il log e termina
    const respond = async (
      statusCode: number,
      body: unknown,
      opts?: {
        service?: ServiceDocument;
        call?: unknown;
        error?: unknown;
        isFile?: boolean;
      },
    ): Promise<void> => {
      const elapsed = Date.now() - startTime;

      if (opts?.service) {
        const responseInfo = opts.isFile
          ? { status: statusCode, body: '[file]' }
          : { status: statusCode, body };

        this.logService
          .create({
            time: startTime,
            owner: opts.service.owner,
            serviceId: opts.service._id.toString(),
            call: opts.call ?? null,
            request: requestInfo,
            response: responseInfo,
            error: opts.error ?? null,
            elapsed,
          })
          .catch((err: unknown) =>
            this.logger.error('Errore nel salvataggio del log:', err),
          );
      }

      if (opts?.isFile) return; // il file è già stato inviato da serveFile()
      res.status(statusCode).send(body);
    };

    // 1. Estrai servicePath e callPath dall'URL
    const match = /^[^?]*\/service\/([^/?]+)\/?(.*?)(?:\?.*)?$/g.exec(req.path);
    if (!match) {
      await respond(404, { error: 'Not found' });
      return;
    }

    const servicePath = match[1];
    const callPath = match[2] ?? '';

    // 2. Cerca il servizio su MongoDB
    const service = await this.serviceModel
      .findOne({ path: servicePath })
      .exec();

    if (!service) {
      await respond(404, { error: `Service '${servicePath}' not found` });
      return;
    }

    // 3. Verifica che il servizio sia attivo
    if (!service.active) {
      await respond(503, { error: 'Service not active!' }, { service });
      return;
    }

    // 4. Gestione OPTIONS: risponde 200 se esiste una call con quel path
    if (req.method.toUpperCase() === 'OPTIONS') {
      const found = findAnyMatchByPath(
        service.calls as unknown as IServiceCall[],
        callPath,
      );
      if (found) {
        res.status(200).end();
      } else {
        res.status(404).json({ error: 'Call not found' });
      }
      return;
    }

    // 5. Trova la call per path + verb (espliciti prima dei marcatori)
    const matched = findBestMatch(
      service.calls as unknown as IServiceCall[],
      callPath,
      req.method,
    );

    if (!matched) {
      await respond(
        404,
        { error: `Call '${callPath}' [${req.method}] not found` },
        { service },
      );
      return;
    }

    const { call, pathValues } = matched;
    const callSnapshot = { ...call };

    // 6. Inizializza la cache (prima invocazione) e ottieni il db corrente
    const db = await this.cacheService.initIfNeeded(service);

    // 7. Costruisci lo scope base
    const scope = buildScope(req, db, pathValues);

    // 8. Valuta le regole in sequenza
    const serviceId = service._id.toString();
    for (const rule of call.rules) {
      const ruleScope = buildRuleScope(scope, rule, req);
      let ruleResult: CalcResult;
      try {
        ruleResult = await calc(rule.expression, ruleScope as Record<string, unknown>);
      } catch (err) {
        this.logger.error(
          `[Service ${serviceId}] Eccezione nella valutazione della regola:`,
          err,
        );
        continue;
      }

      if (ruleResult.db) {
        this.cacheService.updateDb(serviceId, ruleResult.db);
        scope.db = ruleResult.db;
      }

      if (ruleResult.error) {
        this.logger.error(
          `[Service ${serviceId}] Errore nell'espressione della regola:`,
          ruleResult.error,
        );
        continue;
      }

      // Regola soddisfatta → errore configurato
      if (ruleResult.value === true) {
        this.applyResponseExtras(call, res);
        const body = { error: rule.error };
        await respond(rule.code, body, {
          service,
          call: callSnapshot,
          error: rule.error,
        });
        return;
      }
    }

    // 9. File download
    if (call.respType === 'file') {
      this.applyResponseExtras(call, res);
      const fileError = this.serveFile(call, res);
      if (fileError) {
        await respond(500, { error: fileError }, { service, call: callSnapshot, error: fileError });
      } else {
        await respond(200, null, { service, call: callSnapshot, isFile: true });
      }
      return;
    }

    // 10. Calcola la risposta
    let respResult: CalcResult;
    try {
      respResult = await calc(call.response, scope as Record<string, unknown>);
    } catch (err) {
      const errMsg = String(err);
      this.logger.error(
        `[Service ${serviceId}] Eccezione nel calcolo della response:`,
        err,
      );
      await respond(500, { error: errMsg }, { service, call: callSnapshot, error: errMsg });
      return;
    }

    // 11. Aggiorna db cache
    if (respResult.db) {
      this.cacheService.updateDb(serviceId, respResult.db);
    }

    // 12. Invia la risposta
    this.applyResponseExtras(call, res);
    const { statusCode, body } = this.buildResponsePayload(respResult, call, res);
    await respond(statusCode, body, { service, call: callSnapshot });
  }

  // ---------------------------------------------------------------------------

  /** Serializza informazioni rilevanti della request per il log */
  private buildRequestInfo(req: Request): Record<string, unknown> {
    const headers: Record<string, unknown> = {};
    for (const h of LOGGED_HEADERS) {
      if (req.headers[h]) headers[h] = req.headers[h];
    }
    if (req.headers['authorization']) headers['authorization'] = '[present]';

    return {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers,
      ip: req.ip,
      ips: req.ips?.length ? req.ips : undefined,
    };
  }

  /** Applica headers e cookies definiti nella ServiceCall alla response */
  private applyResponseExtras(call: IServiceCall, res: Response): void {
    if (call.headers) {
      Object.entries(call.headers).forEach(([k, v]) => res.setHeader(k, v));
    }
    if (call.cookies) {
      Object.entries(call.cookies).forEach(([k, v]) =>
        res.cookie(k, v),
      );
    }
  }

  /**
   * Calcola status e body da inviare in base al risultato e a respType.
   * Non chiama res direttamente — ci pensa respond().
   */
  private buildResponsePayload(
    result: CalcResult,
    call: IServiceCall,
    res: Response,
  ): { statusCode: number; body: unknown } {
    if (result.error) {
      return { statusCode: 500, body: { error: String(result.error) } };
    }

    const value = result.value;

    if (typeof value !== 'string') {
      // Oggetti/array: res.send() imposterà automaticamente Content-Type json
      return { statusCode: 200, body: value };
    }

    // Stringa: imposta il Content-Type corretto prima di rispondere
    setContentType(call, res);

    return { statusCode: 200, body: value };
  }

  /**
   * Serve un file dall'assets directory.
   * @returns null se ok, stringa di errore in caso di problema
   */
  private serveFile(call: IServiceCall, res: Response): string | null {
    if (!call.file) {
      return 'File path not specified';
    }

    const filePath = path.resolve(ASSETS_DIR, call.file);

    if (!filePath.startsWith(ASSETS_DIR)) {
      return `Invalid file path: ${call.file}`;
    }

    if (!fs.existsSync(filePath)) {
      return `File not found: ${call.file}`;
    }

    res.sendFile(filePath);
    return null;
  }
}


const setContentType = (call: IServiceCall, res: Response) => {
  switch (call.respType) {
    case 'json':
      res.type('json');
      break;
    case 'text':
      res.type('text');
      break;
    case 'html':
      res.type('html');
      break;
  }
};
