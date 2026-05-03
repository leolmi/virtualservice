import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Prepende il prefisso `/api` a tutte le richieste verso il backend
 * applicativo. Esclude i path che il backend serve volutamente alla root:
 *   - `/service/*`  endpoint pubblico dei mock (URL contractuale verso esterni)
 *   - `/mcp[/...]`  endpoint MCP (URL contractuale verso AI clients)
 *   - `/assets/*`   asset statici dell'app
 *
 * Le URL assolute (`http(s)://...`) e quelle già prefissate con `/api/` vengono
 * lasciate intatte.
 */
export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;

  if (
    url.startsWith('/') &&
    !url.startsWith('/api/') &&
    !url.startsWith('/service/') &&
    !url.startsWith('/mcp/') &&
    url !== '/mcp' &&
    !url.startsWith('/assets/')
  ) {
    return next(req.clone({ url: '/api' + url }));
  }

  return next(req);
};
