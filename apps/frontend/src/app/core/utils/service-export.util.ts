import {
  IService,
  IServiceCallParameter,
  IServiceCallRule,
} from '@virtualservice/shared/model';

/** Sanifica una stringa per usarla come filename (rimpiazza char non sicuri). */
export function sanitizeFilename(name: string): string {
  return (name ?? '')
    .replace(/[^\w\-. ]/g, '_')
    .trim()
    .replace(/\s+/g, '-');
}

/** Triggera il download di un oggetto serializzato come JSON. */
export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── OpenAPI 3.0 translation ─────────────────────────────────────────────────

function toOpenApiPath(callPath: string): string {
  const clean = callPath.replace(/^\//, '');
  // Convert Express-style :param → {param}
  const openApi = clean.replace(/:([a-zA-Z_]\w*)/g, '{$1}');
  return '/' + openApi;
}

function respContentType(respType: string | undefined): string {
  const map: Record<string, string> = {
    json: 'application/json',
    text: 'text/plain',
    html: 'text/html',
    file: 'application/octet-stream',
  };
  return map[respType ?? 'json'] ?? 'application/json';
}

/** Costruisce un documento OpenAPI 3.0.3 a partire da un servizio VirtualService. */
export function buildOpenApi(service: IService): object {
  const basePath = `/service/${service.path || sanitizeFilename(service.name)}`;
  const paths: Record<string, Record<string, unknown>> = {};

  for (const call of service.calls ?? []) {
    const apiPath = toOpenApiPath(call.path || '/');
    const method = call.verb.toLowerCase();
    const contentType = respContentType(call.respType);

    const parameters: object[] = (call.parameters ?? [])
      .filter((p: IServiceCallParameter) => p.target !== 'body')
      .map((p: IServiceCallParameter) => ({
        name: p.name,
        in: p.target,
        required: p.target === 'path',
        schema: { type: 'string' },
        ...(p.value !== undefined && p.value !== null
          ? { example: p.value }
          : {}),
      }));

    const bodyParams = (call.parameters ?? []).filter(
      (p: IServiceCallParameter) => p.target === 'body',
    );
    const hasBody =
      bodyParams.length > 0 && ['post', 'put', 'patch'].includes(method);

    const requestBody = hasBody
      ? {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: Object.fromEntries(
                  bodyParams.map((p: IServiceCallParameter) => [
                    p.name,
                    { type: 'string', example: p.value },
                  ]),
                ),
              },
            },
          },
        }
      : undefined;

    const successCode = method === 'post' ? '201' : '200';
    const responses: Record<string, object> = {
      [successCode]: {
        description: 'Successful response',
        content: { [contentType]: { schema: {} } },
        ...(Object.keys(call.headers ?? {}).length > 0
          ? {
              headers: Object.fromEntries(
                Object.keys(call.headers).map((k) => [
                  k,
                  { schema: { type: 'string' } },
                ]),
              ),
            }
          : {}),
      },
    };

    for (const rule of (call.rules ?? []) as IServiceCallRule[]) {
      const code = String(rule.code ?? 400);
      responses[code] = { description: rule.error || `Error ${code}` };
    }

    const operation: Record<string, unknown> = {
      summary: call.description || `${call.verb} ${apiPath}`,
      description: call.description ?? '',
      ...(parameters.length > 0 ? { parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      responses,
    };

    if (!paths[apiPath]) {
      paths[apiPath] = {};
    }
    paths[apiPath][method] = operation;
  }

  return {
    openapi: '3.0.3',
    info: {
      title: service.name,
      description: service.description ?? '',
      version: '1.0.0',
    },
    servers: [
      {
        url: `https://virtualservice.herokuapp.com${basePath}`,
        description: 'VirtualService mock server',
      },
    ],
    paths,
  };
}

/** Download del servizio nel formato nativo VirtualService. */
export function downloadVirtualService(service: IService): void {
  const filename = `${sanitizeFilename(service.name) || 'service'}.json`;
  downloadJson(service, filename);
}

/** Download del servizio nel formato OpenAPI 3.0.3. */
export function downloadOpenApi(service: IService): void {
  const filename = `${sanitizeFilename(service.name) || 'service'}.openapi.json`;
  downloadJson(buildOpenApi(service), filename);
}
