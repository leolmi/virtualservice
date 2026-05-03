import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { filter, map, startWith } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateTemplateDto } from '@virtualservice/shared/dto';
import {
  downloadOpenApi,
  downloadVirtualService,
} from '../core/utils/service-export.util';
import {
  BasePathDialogComponent,
} from './components/base-path-dialog/base-path-dialog.component';
import {
  SaveTemplateDialogComponent,
  SaveTemplateDialogData,
} from './components/save-template-dialog/save-template-dialog.component';
import { ToolbarService } from '../core/services/toolbar.service';
import { ToolbarCommand } from '../core/models/toolbar-command.model';
import * as TemplatesActions from '../templates/store/templates.actions';

import {
  selectEditorService,
  selectEditorActiveCallIndex,
  selectEditorActiveCall,
  selectEditorDirty,
  selectEditorLoading,
  selectEditorSaving,
} from './store/editor.selectors';
import * as EditorActions from './store/editor.actions';

interface TabDef {
  route: string;
  icon: string;
  title: string;
}

@Component({
  selector: 'vs-editor',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent {
  private store = inject(Store);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toolbar = inject(ToolbarService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly service = this.store.selectSignal(selectEditorService);
  readonly activeCallIndex = this.store.selectSignal(selectEditorActiveCallIndex);
  readonly activeCall = this.store.selectSignal(selectEditorActiveCall);
  readonly dirty = this.store.selectSignal(selectEditorDirty);
  readonly loading = this.store.selectSignal(selectEditorLoading);
  readonly saving = this.store.selectSignal(selectEditorSaving);

  readonly search = signal('');

  readonly displayCalls = computed(() => {
    const q = this.search().toLowerCase().trim();
    const svc = this.service();
    if (!svc) return [];
    return svc.calls
      .map((call, idx) => ({ call, idx, size: this.estimateCallSize(call) }))
      .sort((a, b) => a.call.path.localeCompare(b.call.path))
      .filter(
        ({ call }) =>
          !q ||
          call.path.toLowerCase().includes(q) ||
          call.verb.toLowerCase().includes(q),
      );
  });

  /** Limite hard del documento BSON di MongoDB. Oltre questo il save fallisce
   *  per chiunque, admin inclusi. */
  readonly maxServiceSize = 16 * 1024 * 1024;

  /** Dimensione approssimata del service corrente (JSON UTF-8). Stessa formula
   *  usata server-side in `users.service.ts:findAllWithServiceCount`. */
  readonly serviceSize = computed(() => {
    const svc = this.service();
    if (!svc) return 0;
    return this.estimateCallSize(svc);
  });

  readonly serviceSizePercent = computed(() => {
    const total = this.serviceSize();
    return Math.min(100, (total / this.maxServiceSize) * 100);
  });

  private estimateCallSize(call: unknown): number {
    try {
      // TextEncoder è disponibile in browser e in Node 11+ (siamo in Angular SSR-safe? L'editor è solo browser).
      return new TextEncoder().encode(JSON.stringify(call)).length;
    } catch {
      return 0;
    }
  }

  formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  formatPercent(value: number): string {
    if (!Number.isFinite(value) || value < 0) return '—';
    if (value < 0.1) return '< 0.1%';
    if (value < 10) return `${value.toFixed(1)}%`;
    return `${Math.round(value)}%`;
  }

  readonly tabs: TabDef[] = [
    { route: 'call', icon: 'label', title: 'Call definition' },
    { route: 'test', icon: 'flash_on', title: 'Call test' },
    { route: 'database', icon: 'dns', title: 'Service definition' },
    { route: 'function', icon: 'update', title: 'Timed function' },
  ];

  readonly activeTab = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.getActiveTab()),
      startWith(this.getActiveTab()),
    ),
    { initialValue: 'call' },
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(EditorActions.loadEditor({ id }));
    this.toolbar.setForceLow(true);

    effect(() => {
      const svc = this.service();
      const dirty = this.dirty();
      const saving = this.saving();

      const commands: ToolbarCommand[] = [
        {
          id: 'save',
          icon: 'save',
          tooltip: 'Save',
          enabled: !!svc && !!svc.name?.trim() && dirty && !saving,
          color: 'accent',
          action: () => this.onSave(),
        },
        {
          id: 'restart',
          icon: 'settings_backup_restore',
          tooltip: 'Restart service',
          enabled: !!svc,
          action: () => this.onRestart(),
        },
        { type: 'separator' },
        {
          id: 'download-vs',
          icon: 'get_app',
          tooltip: 'Download as virtual-service JSON',
          enabled: !!svc,
          action: () => this.onDownloadVirtualService(),
        },
        {
          id: 'download-openapi',
          icon: 'description',
          tooltip: 'Download as OpenAPI 3.0 JSON',
          enabled: !!svc,
          action: () => this.onDownloadOpenApi(),
        },
        { type: 'separator' },
        {
          id: 'save-template',
          icon: 'collections_bookmark',
          tooltip: 'Save as public template',
          enabled: !!svc && (svc.calls?.length ?? 0) > 0 && !dirty,
          action: () => this.onSaveAsTemplate(),
        },
        {
          id: 'monitor',
          icon: 'desktop_windows',
          tooltip: 'This service calls monitor',
          enabled: !!svc?.active,
          action: () => this.onMonitor(),
        },
        {
          id: 'services',
          icon: 'view_module',
          tooltip: 'My services list',
          action: () => this.router.navigate(['/services']),
        },
      ];
      this.toolbar.set(commands);
    });

    // Feedback save-template
    this.actions$
      .pipe(ofType(TemplatesActions.createTemplateSuccess), takeUntilDestroyed())
      .subscribe(({ template }) => {
        this.snackBar.open(
          `Template "${template.title}" saved`,
          undefined,
          { duration: 3000 },
        );
      });

    this.actions$
      .pipe(ofType(TemplatesActions.createTemplateFailure), takeUntilDestroyed())
      .subscribe(({ error }) => {
        this.snackBar.open(error, 'Close', { duration: 5000 });
      });

    inject(DestroyRef).onDestroy(() => {
      this.store.dispatch(EditorActions.clearEditor());
      this.toolbar.setForceLow(false);
      this.toolbar.clear();
    });
  }

  private getActiveTab(): string {
    const parts = this.router.url.split('/');
    return parts[parts.length - 1] || 'call';
  }

  onSelectCall(idx: number): void {
    this.store.dispatch(EditorActions.selectCall({ index: idx }));
  }

  onTogglePublicAt(idx: number, event: Event): void {
    event.stopPropagation();
    const svc = this.service();
    if (!svc) return;
    const call = svc.calls[idx];
    if (!call) return;
    this.store.dispatch(
      EditorActions.updateCall({
        index: idx,
        changes: { public: !call.public },
      }),
    );
  }

  readonly hasAnyPublicCall = computed(
    () => this.service()?.calls.some((c) => c.public) ?? false,
  );

  onToggleAllPublic(): void {
    const svc = this.service();
    if (!svc?.calls.length) return;
    const value = !svc.calls.some((c) => c.public);
    this.store.dispatch(EditorActions.setAllCallsPublic({ value }));
  }

  onClearSelection(): void {
    this.store.dispatch(EditorActions.selectCall({ index: null }));
  }

  onServiceNameChange(value: string): void {
    this.store.dispatch(EditorActions.updateService({ changes: { name: value } }));
  }

  openPathDialog(): void {
    const svc = this.service();
    if (!svc) return;
    const ref = this.dialog.open(BasePathDialogComponent, {
      width: '420px',
      data: { currentPath: svc.path, serviceId: svc._id },
    });
    ref.afterClosed().subscribe((newPath: string | null) => {
      if (newPath) {
        this.store.dispatch(EditorActions.updateService({ changes: { path: newPath } }));
      }
    });
  }

  navigateToTab(route: string): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.router.navigate(['/editor', id, route]);
  }

  private onSave(): void {
    this.store.dispatch(EditorActions.saveEditor());
  }

  private onRestart(): void {
    const svc = this.service();
    if (!svc) return;
    this.snackBar.open('Restart service coming soon', 'Close', {
      duration: 2000,
    });
  }

  private onMonitor(): void {
    const svc = this.service();
    if (!svc) return;
    this.router.navigate(['/monitor', svc._id]);
  }

  private onDownloadVirtualService(): void {
    const svc = this.service();
    if (!svc) return;
    downloadVirtualService(svc);
  }

  private onDownloadOpenApi(): void {
    const svc = this.service();
    if (!svc) return;
    downloadOpenApi(svc);
  }

  private onSaveAsTemplate(): void {
    const svc = this.service();
    if (!svc) return;
    if (this.dirty()) {
      this.snackBar.open(
        'Save the service first before creating a template',
        'Close',
        { duration: 3000 },
      );
      return;
    }
    const ref = this.dialog.open(SaveTemplateDialogComponent, {
      data: { service: svc } satisfies SaveTemplateDialogData,
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe((dto: CreateTemplateDto | null | undefined) => {
      if (dto) {
        this.store.dispatch(TemplatesActions.createTemplate({ dto }));
      }
    });
  }
}
