import {
  All,
  Body,
  Controller,
  HttpStatus,
  Logger,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { McpServerFactory } from './mcp-server.factory';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

interface RequestWithApiKey extends RequestWithUser {
  apiKeyId?: string;
}

/**
 * Controller MCP — endpoint Streamable HTTP unico (POST /mcp).
 *
 * Modalità stateless: nessun `sessionIdGenerator`, una nuova
 * `McpServer` + `Transport` per ogni request. La pulizia avviene quando
 * la connessione HTTP si chiude.
 *
 * Auth via `ApiKeyGuard` (API key utente, formato `vsk_<prefix>_<secret>`).
 * Il throttle dedicato `'mcp'` viene wirato in slice 10.
 */
@Controller('mcp')
@UseGuards(ApiKeyGuard)
@SkipThrottle({ default: true, strict: true })
export class McpController {
  private readonly logger = new Logger(McpController.name);
  private readonly mcpEnabled: boolean;

  constructor(
    private readonly factory: McpServerFactory,
    config: ConfigService,
  ) {
    const raw = config.get<string>('VIRTUALSERVICE_MCP_ENABLED');
    this.mcpEnabled = raw === undefined ? true : raw.toLowerCase() !== 'false';
  }

  @All()
  async handle(
    @Req() req: RequestWithApiKey,
    @Res() res: Response,
    @Body() body: unknown,
  ): Promise<void> {
    if (!this.mcpEnabled) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        error: { code: 'MCP_DISABLED', message: 'MCP endpoint is disabled' },
      });
      return;
    }

    if (!req.apiKeyId) {
      // Should never happen — ApiKeyGuard always sets it on success.
      throw new UnauthorizedException('Missing apiKeyId on request');
    }

    const server = this.factory.create(req.user, req.apiKeyId);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    res.on('close', () => {
      transport.close().catch((err) =>
        this.logger.warn(`Transport close error: ${(err as Error).message}`),
      );
      server.close().catch((err) =>
        this.logger.warn(`Server close error: ${(err as Error).message}`),
      );
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req as Request, res, body);
    } catch (err) {
      this.logger.error(
        `MCP handler error: ${(err as Error).message}`,
        (err as Error).stack,
      );
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: { code: 'INTERNAL_ERROR', message: (err as Error).message },
        });
      }
    }
  }
}
