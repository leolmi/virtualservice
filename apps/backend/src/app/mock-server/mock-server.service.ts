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
import { findBestMatch, findAnyMatchByPath } from './utils/path-matcher.util';
import { buildScope, buildRuleScope } from './utils/scope-builder.util';
import { CalcResult } from './interfaces/scope.interface';
import calc from './workers/calc';

/** Regex da server.md: cattura tutto dopo /service/ */
const SERVICE_PATH_RE = /^[^?]*\/service\/([^/?]+)\/?(.*?)(?:\?.*)?$/;

/** Cartella degli asset per il file download */
const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');

@Injectable()
export class MockServerService {
  private readonly logger = new Logger(MockServerService.name);

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly cacheService: ServiceCacheService,
  ) {}

  async handleRequest(req: Request, res: Response): Promise<void> {
    // 1. Estrai servicePath e callPath dall'URL
    const match = req.path.match(SERVICE_PATH_RE);
    if (!match) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const servicePath = match[1];
    const callPath = match[2] ?? '';

    // 2. Cerca il servizio su MongoDB
    const service = await this.serviceModel
      .findOne({ path: servicePath })
      .exec();

    if (!service) {
      res.status(404).json({ error: `Service '${servicePath}' not found` });
      return;
    }

    // 4. Gestione OPTIONS: risponde 200 se esiste una call attiva con quel path
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

    // 5. Verifica che il servizio sia attivo
    if (!service.active) {
      res.status(500).json({ error: 'Service not active!' });
      return;
    }

    // 6. Trova la call per path + verb (espliciti prima dei marcatori)
    const matched = findBestMatch(
      service.calls as unknown as IServiceCall[],
      callPath,
      req.method,
    );

    if (!matched) {
      res
        .status(404)
        .json({ error: `Call '${callPath}' [${req.method}] not found` });
      return;
    }

    const { call, pathValues } = matched;

    // 8. Inizializza la cache (prima invocazione) e ottieni il db corrente
    const db = await this.cacheService.initIfNeeded(service);

    // 9. Costruisci lo scope base
    const scope = buildScope(req, db, pathValues);

    // 10. Valuta le regole in sequenza
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
        // Errore nell'esecuzione → considera false, prosegui
        continue;
      }

      // Aggiorna il db cache con quello eventualmente modificato dalla regola
      if (ruleResult.db) {
        this.cacheService.updateDb(serviceId, ruleResult.db);
        scope.db = ruleResult.db;
      }

      if (ruleResult.error) {
        this.logger.error(
          `[Service ${serviceId}] Errore nell'espressione della regola:`,
          ruleResult.error,
        );
        // Considera false
        continue;
      }

      // Regola soddisfatta → restituisce errore e interrompe
      if (ruleResult.value === true) {
        this.applyResponseExtras(call, res);
        res.status(rule.code).json({ error: rule.error });
        return;
      }
    }

    // 11. File download
    if (call.respType === 'file') {
      this.serveFile(call, res);
      return;
    }

    // 12. Calcola la risposta
    let respResult: CalcResult;
    try {
      respResult = await calc(call.response, scope as Record<string, unknown>);
    } catch (err) {
      this.logger.error(
        `[Service ${serviceId}] Eccezione nel calcolo della response:`,
        err,
      );
      res.status(500).json({ error: String(err) });
      return;
    }

    // 13. Aggiorna db cache con quello restituito dalla response
    if (respResult.db) {
      this.cacheService.updateDb(serviceId, respResult.db);
    }

    // 14. Invia la risposta
    this.applyResponseExtras(call, res);
    this.sendResponse(respResult, call, res);
  }

  // ---------------------------------------------------------------------------

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

  /** Serializza e invia il risultato del calcolo in base a respType */
  private sendResponse(
    result: CalcResult,
    call: IServiceCall,
    res: Response,
  ): void {
    if (result.error) {
      res.status(500).json({ error: String(result.error) });
      return;
    }

    const value = result.value;

    // Valore non-stringa → json diretto
    if (typeof value !== 'string') {
      res.status(200).json(value);
      return;
    }

    // Valore stringa → rispetta respType
    switch (call.respType) {
      case 'json':
        res.status(200).type('json').send(JSON.stringify(value));
        break;
      case 'text':
        res.status(200).type('text').send(String(value));
        break;
      case 'html':
        res.status(200).type('html').send(value);
        break;
      default:
        res.status(200).json(value);
    }
  }

  /** Serve un file dall'assets directory */
  private serveFile(call: IServiceCall, res: Response): void {
    if (!call.file) {
      res.status(500).json({ error: 'File path not specified' });
      return;
    }

    const filePath = path.resolve(ASSETS_DIR, call.file);

    // Protezione path traversal
    if (!filePath.startsWith(ASSETS_DIR)) {
      res.status(500).json({ error: `Invalid file path: ${call.file}` });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res
        .status(500)
        .json({ error: `File not found: ${call.file}` });
      return;
    }

    this.applyResponseExtras(call, res);
    res.sendFile(filePath);
  }
}
