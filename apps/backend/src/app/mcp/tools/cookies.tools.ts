import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpError, withCallMutation } from './_helpers';
import { ToolDeps } from './_tool-deps';
import { HTTP_VERBS } from './_schemas';

function getCookies(call: Record<string, unknown>): Record<string, string> {
  const c = (call['cookies'] as Record<string, string> | undefined) ?? {};
  call['cookies'] = c;
  return c;
}

/**
 * Tool MCP `add_cookie` — aggiunge un cookie alla response della call.
 * Fallisce se un cookie con lo stesso `name` già esiste.
 */
export function registerAddCookie(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'add_cookie',
    {
      title: 'Add response cookie to a call',
      description:
        "Adds a response cookie to a specific call. Fails with VALIDATION_FAILED if `name` already exists; use update_cookie to change the value of an existing cookie.",
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
          tool: 'add_cookie',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const cookies = getCookies(call);
          if (input.name in cookies) {
            return mcpError(
              'VALIDATION_FAILED',
              `Cookie "${input.name}" already exists on this call. Use update_cookie to change its value.`,
            );
          }
          cookies[input.name] = input.value;
          return undefined;
        },
      );
    },
  );
}

/**
 * Tool MCP `update_cookie` — modifica il value di un cookie esistente.
 */
export function registerUpdateCookie(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'update_cookie',
    {
      title: 'Update response cookie on a call',
      description:
        "Updates the value of an existing response cookie (identified by `name`). Fails with COOKIE_NOT_FOUND if no cookie with that name exists.",
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
          tool: 'update_cookie',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const cookies = getCookies(call);
          if (!(input.name in cookies)) {
            return mcpError(
              'COOKIE_NOT_FOUND',
              `No cookie with name "${input.name}" on call ${input.callVerb} ${input.callPath}`,
            );
          }
          cookies[input.name] = input.value;
          return undefined;
        },
      );
    },
  );
}

/**
 * Tool MCP `remove_cookie` — rimuove un cookie dalla response della call.
 */
export function registerRemoveCookie(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'remove_cookie',
    {
      title: 'Remove response cookie from a call',
      description: "Removes a response cookie (identified by `name`) from a specific call.",
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
          tool: 'remove_cookie',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const cookies = getCookies(call);
          if (!(input.name in cookies)) {
            return mcpError(
              'COOKIE_NOT_FOUND',
              `No cookie with name "${input.name}" on call ${input.callVerb} ${input.callPath}`,
            );
          }
          delete cookies[input.name];
          return undefined;
        },
      );
    },
  );
}
