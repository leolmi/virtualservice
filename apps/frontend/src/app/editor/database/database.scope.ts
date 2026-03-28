import {
  ExpressionHelpContext,
  ScopeVariable,
} from '../../core/models/expression-help.model';
import { IServiceItem } from '../../services/store/services.state';

export const getScopeContext = (service: IServiceItem|null): ExpressionHelpContext | null => {
  if (!service) return null;

  const label = service?.name || service?.path || 'service';

  const variables: ScopeVariable[] = [
    {
      name: 'result',
      type: 'object',
      description:
        'The value returned by this expression becomes the service cache (db) — shared across all calls. Must be an object. Initialized once on the first request.',
      tag: 'return value',
      examples: [
        {
          description: 'Static initial data',
          code: 'return {\n  users: [],\n  counter: 0\n}',
        },
        {
          description: 'Pre-populated list with generated IDs',
          code: 'return {\n  items: [\n    { id: guid(), name: "Alpha", active: true },\n    { id: guid(), name: "Beta",  active: false }\n  ]\n}',
        },
        {
          description: 'Indexed map (fast lookup by id)',
          code: 'const items = [\n  { id: "1", label: "foo" },\n  { id: "2", label: "bar" }\n];\nreturn { items, byId: _.keyBy(items, "id") }',
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
          description: 'Index array by key',
          code: '_.keyBy(items, "id")',
        },
        {
          description: 'Group by field',
          code: '_.groupBy(items, "category")',
        },
        {
          description: 'Generate a numeric range',
          code: '_.range(1, 6)',
          result: '[1, 2, 3, 4, 5]',
        },
        {
          description: 'Deep clone',
          code: '_.cloneDeep(sourceObject)',
        },
      ],
    },
    {
      name: 'guid',
      type: '(mask?: string) => string',
      description: 'Generates a random GUID string',
      tag: 'built-in',
      examples: [
        {
          description: 'Standard GUID',
          code: 'guid()',
          result: '"a1b2-c3d4-e5f6-7890"',
        },
        { description: 'Custom mask', code: 'guid("xxxx-xxxx")' },
      ],
    },
  ];

  return {
    title: `dbo — ${label}`,
    variables,
  };
};
