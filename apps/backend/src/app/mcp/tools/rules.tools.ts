import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpError, withCallMutation } from './_helpers';
import { ToolDeps } from './_tool-deps';
import { HTTP_VERBS, ruleSchema } from './_schemas';

interface RawRule {
  id?: string;
  expression?: string;
  path?: string;
  error?: string;
  code?: number;
}

function getRules(call: Record<string, unknown>): RawRule[] {
  const rules = (call['rules'] as RawRule[] | undefined) ?? [];
  call['rules'] = rules;
  return rules;
}

/**
 * Tool MCP `add_rule` — appende una rule alla call.
 *
 * L'`id` può essere omesso (verrà generato dal pre-save hook). Se passato
 * dall'agente deve essere unique nella stessa call.
 */
export function registerAddRule(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'add_rule',
    {
      title: 'Add rule to a call',
      description:
        "Appends a rule to a specific call. The rule's `id` is optional — if omitted, the server assigns a fresh uuid v4 on save. Returns the rule id after save.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        rule: ruleSchema,
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withCallMutation(
        user,
        deps,
        {
          tool: 'add_rule',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const rules = getRules(call);
          if (input.rule.id && rules.some((r) => r.id === input.rule.id)) {
            return mcpError(
              'VALIDATION_FAILED',
              `Rule with id "${input.rule.id}" already exists on this call`,
            );
          }
          rules.push({ ...input.rule });
          return undefined;
        },
        (saved, mutatedCall) => {
          const addedRules = (mutatedCall['rules'] as RawRule[] | undefined) ?? [];
          const added = addedRules[addedRules.length - 1];
          return {
            serviceId: String(saved._id),
            callPath: input.callPath,
            callVerb: input.callVerb,
            ruleId: added?.id ?? null,
            rulesCount: addedRules.length,
            lastChange: saved.lastChange,
          };
        },
      );
    },
  );
}

/**
 * Tool MCP `update_rule` — modifica una rule identificata per `id`.
 *
 * Su servizi pre-feature, le rules potrebbero non avere ancora un id.
 * In quel caso un save (qualsiasi) le popola tramite il pre-save hook
 * e da quel momento sono identificabili.
 */
export function registerUpdateRule(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'update_rule',
    {
      title: 'Update rule on a call',
      description:
        "Updates a rule (identified by `ruleId`) on a specific call. Patch fields are merged shallowly. If no rule on this call has an id yet (legacy data), call get_call first or save the service once to trigger uuid backfill.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        ruleId: z.string().min(1),
        patch: z
          .object({
            expression: z.string().optional(),
            path: z.string().optional(),
            error: z.string().optional(),
            code: z.number().int().optional(),
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
          tool: 'update_rule',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const rules = getRules(call);
          const idx = rules.findIndex((r) => r.id === input.ruleId);
          if (idx < 0) {
            const anyMissingId = rules.some((r) => !r.id);
            const hint = anyMissingId
              ? ' (some rules on this call have no id yet — save the service once to trigger uuid backfill, then retry)'
              : '';
            return mcpError(
              'RULE_NOT_FOUND',
              `No rule with id "${input.ruleId}" on call ${input.callVerb} ${input.callPath}${hint}`,
            );
          }
          rules[idx] = { ...rules[idx], ...input.patch };
          return undefined;
        },
      );
    },
  );
}

/**
 * Tool MCP `remove_rule` — elimina una rule identificata per `id`.
 */
export function registerRemoveRule(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'remove_rule',
    {
      title: 'Remove rule from a call',
      description:
        "Removes a rule (identified by `ruleId`) from a specific call.",
      inputSchema: {
        serviceId: z.string().min(1),
        callPath: z.string(),
        callVerb: z.enum(HTTP_VERBS),
        ruleId: z.string().min(1),
        expectedLastChange: z.number().int().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withCallMutation(
        user,
        deps,
        {
          tool: 'remove_rule',
          args,
          serviceId: input.serviceId,
          callPath: input.callPath,
          callVerb: input.callVerb,
          expectedLastChange: input.expectedLastChange,
        },
        (call) => {
          const rules = getRules(call);
          const before = rules.length;
          call['rules'] = rules.filter((r) => r.id !== input.ruleId);
          if ((call['rules'] as RawRule[]).length === before) {
            return mcpError(
              'RULE_NOT_FOUND',
              `No rule with id "${input.ruleId}" on call ${input.callVerb} ${input.callPath}`,
            );
          }
          return undefined;
        },
      );
    },
  );
}
