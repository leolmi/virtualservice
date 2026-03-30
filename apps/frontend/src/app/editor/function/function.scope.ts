import { IServiceItem } from '../../services/store/services.state';
import {
  ExpressionHelpContext,
  ScopeVariable,
} from '../../core/models/expression-help.model';
import { SCOPE_GUID } from '../editor-common.scope';

export const getScopeContext = (
  service: IServiceItem | null,
): ExpressionHelpContext | null => {
  const label = service?.name || service?.path || 'service';
  const interval = service?.interval ?? 0;

  const variables: ScopeVariable[] = [
    {
      name: 'db',
      type: 'object',
      description:
        'Current service cache — shared with all calls. Modify it directly; changes are persisted for the next execution.',
      examples: [
        {
          description: 'Increment a counter',
          code: 'db.counter = (db.counter || 0) + 1;',
        },
        {
          description: 'Append a timestamped entry',
          code: 'db.log = db.log || [];\ndb.log.push({ ts: Date.now(), id: guid() });\nif (db.log.length > 100) db.log.shift();',
        },
        {
          description: 'Update items with a computed value',
          code: '_.each(db.items, item => {\n  item.updatedAt = Date.now();\n});',
        },
        {
          description: 'Rotate a queue',
          code: 'const first = db.queue.shift();\nif (first) db.queue.push(first);',
        },
      ],
    },
    {
      name: '_',
      type: 'lodash',
      description: 'Lodash utility library — available in every expression',
      tag: 'built-in',
      examples: [
        {
          description: 'Update matching items',
          code: '_.each(_.filter(db.items, { active: true }), i => {\n  i.score += 1;\n});',
        },
        {
          description: 'Remove stale entries',
          code: 'db.items = _.filter(db.items, i => i.ts > Date.now() - 60000);',
        },
        {
          description: 'Shuffle a list',
          code: 'db.items = _.shuffle(db.items);',
        },
      ],
    },
    SCOPE_GUID,
  ];

  return {
    title: `schedulerFn — ${label} (every ${interval}s)`,
    variables,
  };
};
