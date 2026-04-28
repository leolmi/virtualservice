import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HttpVerb } from '@virtualservice/shared/model';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpError, mcpResult, nestErrorToMcp } from './_helpers';
import { ToolDeps } from './_tool-deps';

const VERBS: HttpVerb[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Tool MCP `get_call` — dettaglio completo di una singola call.
 *
 * Identifica la call per `path + verb` (più stabile dell'indice).
 */
export function registerGetCall(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'get_call',
    {
      title: 'Get call',
      description:
        'Returns the full ServiceCall structure (path, verb, description, response, file, respType, rules, body, parameters, headers, cookies) for a specific call identified by path + verb inside a service.',
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string().describe('Call path as stored on the call (no leading slash, may include {placeholders})'),
        callVerb: z.enum(VERBS as [HttpVerb, ...HttpVerb[]]),
      },
    },
    async ({ serviceId, callPath, callVerb }) => {
      try {
        const service = await deps.servicesService.findOne(
          serviceId,
          user.userId,
          user.role,
        );
        const call = (service.calls ?? []).find(
          (c) => c.path === callPath && c.verb === callVerb,
        );
        if (!call) {
          return mcpError(
            'CALL_NOT_FOUND',
            `No call with path "${callPath}" and verb "${callVerb}" in service ${serviceId}`,
          );
        }
        return mcpResult({
          serviceId: String(service._id),
          path: call.path,
          verb: call.verb,
          description: call.description,
          response: call.response,
          file: call.file,
          respType: call.respType,
          rules: call.rules ?? [],
          body: call.body,
          parameters: call.parameters ?? [],
          headers: call.headers ?? {},
          cookies: call.cookies ?? {},
        });
      } catch (err) {
        const mapped = nestErrorToMcp(err, { notFoundCode: 'SERVICE_NOT_FOUND' });
        if (mapped) return mapped;
        throw err;
      }
    },
  );
}
