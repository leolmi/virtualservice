import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpError, withCallMutation } from './_helpers';
import { ToolDeps } from './_tool-deps';
import { HTTP_VERBS, parameterSchema, PARAMETER_TARGETS } from './_schemas';

interface RawParam {
  code?: string;
  name?: string;
  target?: string;
  key?: string;
  value?: unknown;
}

function getParameters(call: Record<string, unknown>): RawParam[] {
  const params = (call['parameters'] as RawParam[] | undefined) ?? [];
  call['parameters'] = params;
  return params;
}

/**
 * Tool MCP `add_param` — appende un parameter alla call.
 * I parameter sono identificati per `name`: l'unicità è enforced.
 */
export function registerAddParam(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'add_param',
    {
      title: 'Add parameter to a call',
      description:
        "Appends a parameter to a specific call. The parameter's `name` must be unique within the call.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        parameter: parameterSchema,
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withCallMutation(
        user,
        deps,
        {
          tool: 'add_param',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const params = getParameters(call);
          if (params.some((p) => p.name === input.parameter.name)) {
            return mcpError(
              'VALIDATION_FAILED',
              `Parameter "${input.parameter.name}" already exists on this call`,
            );
          }
          params.push({ ...input.parameter });
          return undefined;
        },
      );
    },
  );
}

/**
 * Tool MCP `update_param` — modifica un parameter identificato per `name`.
 */
export function registerUpdateParam(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'update_param',
    {
      title: 'Update parameter on a call',
      description:
        "Updates a parameter (identified by `name`) on a specific call. Patch fields are merged shallowly.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        name: z.string().min(1),
        patch: z
          .object({
            code: z.string().optional(),
            target: z.enum(PARAMETER_TARGETS).optional(),
            key: z.string().optional(),
            value: z.unknown().optional(),
          })
          .strict(),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withCallMutation(
        user,
        deps,
        {
          tool: 'update_param',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const params = getParameters(call);
          const idx = params.findIndex((p) => p.name === input.name);
          if (idx < 0) {
            return mcpError(
              'PARAM_NOT_FOUND',
              `No parameter with name "${input.name}" on call ${input.callVerb} ${input.callPath}`,
            );
          }
          params[idx] = { ...params[idx], ...input.patch };
          return undefined;
        },
      );
    },
  );
}

/**
 * Tool MCP `remove_param` — elimina un parameter identificato per `name`.
 */
export function registerRemoveParam(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'remove_param',
    {
      title: 'Remove parameter from a call',
      description:
        "Removes a parameter (identified by `name`) from a specific call.",
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
          tool: 'remove_param',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const params = getParameters(call);
          const before = params.length;
          call['parameters'] = params.filter((p) => p.name !== input.name);
          if ((call['parameters'] as RawParam[]).length === before) {
            return mcpError(
              'PARAM_NOT_FOUND',
              `No parameter with name "${input.name}" on call ${input.callVerb} ${input.callPath}`,
            );
          }
          return undefined;
        },
      );
    },
  );
}
