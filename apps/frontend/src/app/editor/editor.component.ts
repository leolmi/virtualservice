import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  BasePathDialogComponent,
} from './components/base-path-dialog/base-path-dialog.component';
import { ToolbarService } from '../core/services/toolbar.service';
import { ToolbarCommand } from '../core/models/toolbar-command.model';

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
      .map((call, idx) => ({ call, idx }))
      .sort((a, b) => a.call.path.localeCompare(b.call.path))
      .filter(
        ({ call }) =>
          !q ||
          call.path.toLowerCase().includes(q) ||
          call.verb.toLowerCase().includes(q),
      );
  });

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
    this.navigateToTab('call');
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
}
