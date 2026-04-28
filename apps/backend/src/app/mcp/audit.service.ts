import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { McpAudit, McpAuditDocument } from './schemas/mcp-audit.schema';

const MAX_ARGS_BYTES = 4 * 1024;

export interface AuditMutationInput {
  userId: string;
  keyId: string;
  tool: string;
  args: unknown;
  success: boolean;
  errorCode?: string | null;
}

/**
 * Audit log delle mutation MCP. Solo le tool che modificano lo stato
 * vengono registrate; le read no.
 *
 * Le scritture sono **fire-and-forget** — gli errori del log vengono
 * notificati a console ma non propagati alle tool callback.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(McpAudit.name)
    private readonly auditModel: Model<McpAuditDocument>,
  ) {}

  /** Registra una mutation. Restituisce immediatamente; il write è async. */
  recordMutation(input: AuditMutationInput): void {
    const { args, truncated } = this.truncateArgs(input.args);
    this.auditModel
      .create({
        userId: input.userId,
        keyId: input.keyId,
        tool: input.tool,
        args,
        argsTruncated: truncated,
        success: input.success,
        errorCode: input.errorCode ?? null,
        ts: new Date(),
      })
      .catch((err) => {
        this.logger.warn(
          `Failed to record MCP audit for tool ${input.tool}: ${(err as Error).message}`,
        );
      });
  }

  private truncateArgs(args: unknown): { args: unknown; truncated: boolean } {
    if (args === undefined || args === null) {
      return { args: args ?? null, truncated: false };
    }
    let serialized: string;
    try {
      serialized = JSON.stringify(args);
    } catch {
      return { args: '<unserialisable>', truncated: true };
    }
    if (Buffer.byteLength(serialized, 'utf8') <= MAX_ARGS_BYTES) {
      return { args, truncated: false };
    }
    // Conserva una stringa accorciata dell'originale per debugging
    const truncated = serialized.slice(0, MAX_ARGS_BYTES);
    return { args: { __truncated: truncated }, truncated: true };
  }
}
