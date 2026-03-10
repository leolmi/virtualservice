import { Component, inject, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { IServiceItem } from '../store/services.state';
import {
  IService,
  IServiceCall,
  IServiceCallParameter,
  IServiceCallRule,
} from '@virtualservice/shared/model';

@Component({
  selector: 'vs-service-tile',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './service-tile.component.html',
  styleUrl: './service-tile.component.scss',
})
export class ServiceTileComponent {
  service = input.required<IServiceItem>();

  toggleActive = output<IServiceItem>();
  toggleStarred = output<IServiceItem>();
  delete = output<string>();
  open = output<string>();
  monitor = output<string>();

  private dialog = inject(MatDialog);

  // ──────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private _sanitizeFilename(name: string): string {
    return name
      .replace(/[^\w\-. ]/g, '_')
      .trim()
      .replace(/\s+/g, '-');
  }

  private _downloadJson(data: object, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ──────────────────────────────────────────────
  // OpenAPI 3.0 translation
  // ──────────────────────────────────────────────

  private _toOpenApiPath(callPath: string): string {
    const clean = callPath.replace(/^\//, '');
    // Convert Express-style :param → {param}
    const openApi = clean.replace(/:([a-zA-Z_]\w*)/g, '{$1}');
    return '/' + openApi;
  }

  private _respContentType(respType: IServiceCall['respType']): string {
    const map: Record<string, string> = {
      json: 'application/json',
      text: 'text/plain',
      html: 'text/html',
      file: 'application/octet-stream',
    };
    return map[respType ?? 'json'] ?? 'application/json';
  }

  private _buildOpenApi(service: IService): object {
    const basePath = `/service/${service.path || this._sanitizeFilename(service.name)}`;

    const paths: Record<string, Record<string, unknown>> = {};

    for (const call of service.calls ?? []) {
      const apiPath = this._toOpenApiPath(call.path || '/');
      const method = call.verb.toLowerCase();
      const contentType = this._respContentType(call.respType);

      // Parameters: path, query, header (body handled separately as requestBody)
      const parameters: object[] = (call.parameters ?? [])
        .filter((p: IServiceCallParameter) => p.target !== 'body')
        .map((p: IServiceCallParameter) => ({
          name: p.name,
          in: p.target, // 'path' | 'query' | 'header'
          required: p.target === 'path',
          schema: { type: 'string' },
          ...(p.value !== undefined && p.value !== null
            ? { example: p.value }
            : {}),
        }));

      // Request body for POST / PUT / PATCH
      const bodyParams = (call.parameters ?? []).filter(
        (p: IServiceCallParameter) => p.target === 'body'
      );
      const hasBody =
        bodyParams.length > 0 &&
        ['post', 'put', 'patch'].includes(method);

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
                    ])
                  ),
                },
              },
            },
          }
        : undefined;

      // Responses
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
                  ])
                ),
              }
            : {}),
        },
      };

      for (const rule of call.rules ?? [] as IServiceCallRule[]) {
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

  // ──────────────────────────────────────────────
  // Event handlers
  // ──────────────────────────────────────────────

  onCardClick(): void {
    this.open.emit(this.service()._id);
  }

  onToggleActive(event: Event): void {
    event.stopPropagation();
    const s = this.service();
    this.toggleActive.emit({ ...s, active: !s.active });
  }

  onToggleStarred(event: Event): void {
    event.stopPropagation();
    const s = this.service();
    this.toggleStarred.emit({ ...s, starred: !s.starred });
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    const data: ConfirmDialogData = {
      title: 'Delete Service',
      message: `Delete "${this.service().name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.delete.emit(this.service()._id);
      }
    });
  }

  onOpen(event: Event): void {
    event.stopPropagation();
    this.open.emit(this.service()._id);
  }

  onMonitor(event: Event): void {
    event.stopPropagation();
    this.monitor.emit(this.service()._id);
  }

  onDownloadVirtualService(): void {
    const service = this.service();
    const filename = `${this._sanitizeFilename(service.name)}.json`;
    this._downloadJson(service, filename);
  }

  onDownloadOpenApi(): void {
    const service = this.service();
    const filename = `${this._sanitizeFilename(service.name)}.openapi.json`;
    this._downloadJson(this._buildOpenApi(service), filename);
  }
}
