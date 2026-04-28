import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpError, withCallMutation } from './_helpers';
import { ToolDeps } from './_tool-deps';
import { HTTP_VERBS } from './_schemas';

function getHeaders(call: Record<string, unknown>): Record<string, string> {
  const h = (call['headers'] as Record<string, string> | undefined) ?? {};
  call['headers'] = h;
  return h;
}

/**
 * Tool MCP `add_header` — aggiunge un header alla response della call.
 * Fallisce se un header con lo stesso `name` già esiste.
 */
export function registerAddHeader(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'add_header',
    {
      title: 'Add response header to a call',
      description:
        "Adds a response header to a specific call. Fails with VALIDATION_FAILED if `name` already exists; use update_header to change the value of an existing header.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        name: z.string().min(1),
        value: z.string(),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withCallMutation(
        user,
        deps,
        {
          tool: 'add_header',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const headers = getHeaders(call);
          if (input.name in headers) {
            return mcpError(
              'VALIDATION_FAILED',
              `Header "${input.name}" already exists on this call. Use update_header to change its value.`,
            );
          }
          headers[input.name] = input.value;
          return undefined;
        },
      );
    },
  );
}

/**
 * Tool MCP `update_header` — modifica il value di un header esistente.
 */
export function registerUpdateHeader(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'update_header',
    {
      title: 'Update response header on a call',
      description:
        "Updates the value of an existing response header (identified by `name`). Fails with HEADER_NOT_FOUND if no header with that name exists.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        name: z.string().min(1),
        value: z.string(),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withCallMutation(
        user,
        deps,
        {
          tool: 'update_header',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const headers = getHeaders(call);
          if (!(input.name in headers)) {
            return mcpError(
              'HEADER_NOT_FOUND',
              `No header with name "${input.name}" on call ${input.callVerb} ${input.callPath}`,
            );
          }
          headers[input.name] = input.value;
          return undefined;
        },
      );
    },
  );
}

/**
 * Tool MCP `remove_header` — rimuove un header dalla response della call.
 */
export function registerRemoveHeader(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'remove_header',
    {
      title: 'Remove response header from a call',
      description: "Removes a response header (identified by `name`) from a specific call.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        name: z.string().min(1),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withCallMutation(
        user,
        deps,
        {
          tool: 'remove_header',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const headers = getHeaders(call);
          if (!(input.name in headers)) {
            return mcpError(
              'HEADER_NOT_FOUND',
              `No header with name "${input.name}" on call ${input.callVerb} ${input.callPath}`,
            );
          }
          delete headers[input.name];
          return undefined;
        },
      );
    },
  );
}
