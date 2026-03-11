import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ToolbarService } from '../core/services/toolbar.service';
import { ToolbarCommand } from '../core/models/toolbar-command.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../core/components/confirm-dialog/confirm-dialog.component';
import { selectUser } from '../auth/store/auth.selectors';
import { logout } from '../auth/store/auth.actions';
import {
  ILogItem,
  LogRequest,
  MonitorApiService,
} from './monitor-api.service';
import { IServiceItem } from '../services/store/services.state';

// ── helpers ────────────────────────────────────────────────────────────────

function req(item: ILogItem): LogRequest {
  return (item.request as LogRequest) ?? {};
}

function pad2(n: number): string { return n.toString().padStart(2, '0'); }
function pad3(n: number): string { return n.toString().padStart(3, '0'); }

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
}

function fmtElapsed(ms?: number): string {
  return ms !== undefined && ms !== null ? `${ms}ms` : '-';
}

function fmtOrigin(item: ILogItem): string {
  return req(item).ip || 'unknown';
}

function fmtMethod(item: ILogItem): string {
  return (req(item).method || 'unknown').toUpperCase();
}

function fmtPath(item: ILogItem): string {
  const r = req(item);
  const p = r.path ?? '';
  const q = r.query;
  if (!q || Object.keys(q).length === 0) return p;
  const qs = Object.entries(q)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${p}?${qs}`;
}

// ── component ──────────────────────────────────────────────────────────────

/** Polling interval in milliseconds */
const POLL_MS = 2000;

@Component({
  selector: 'vs-monitor',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss',
})
export class MonitorComponent implements OnDestroy {
  private api = inject(MonitorApiService);
  private http = inject(HttpClient);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toolbarService = inject(ToolbarService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  private readonly serviceId = this.route.snapshot.paramMap.get('id')!;
  private readonly user = this.store.selectSignal(selectUser);

  readonly serviceName = signal<string>('');
  readonly items = signal<ILogItem[]>([]);
  readonly search = signal('');
  readonly selectedItem = signal<ILogItem | null>(null);

  readonly filteredItems = computed(() => {
    const q = this.search().trim().toLowerCase();
    return q
      ? this.items().filter((i) => fmtPath(i).toLowerCase().includes(q))
      : this.items();
  });

  readonly detailRequest = computed(() => {
    const item = this.selectedItem();
    return item ? JSON.stringify(item.request, null, 2) : null;
  });

  readonly detailResponse = computed(() => {
    const item = this.selectedItem();
    if (!item) return null;
    return JSON.stringify(item.response ?? item.error ?? null, null, 2);
  });

  readonly hasDetailError = computed(() => !!this.selectedItem()?.error);

  // expose format helpers to the template
  readonly fmtTime = fmtTime;
  readonly fmtElapsed = fmtElapsed;
  readonly fmtOrigin = fmtOrigin;
  readonly fmtMethod = fmtMethod;
  readonly fmtPath = fmtPath;

  private lastTime = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // fetch service name for display
    this.http
      .get<IServiceItem>(`/api/services/${this.serviceId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (s) => this.serviceName.set(s.name || this.serviceId) });

    // toolbar
    this.toolbarService.setForceLow(true);
    // rebuild toolbar whenever user changes (admin check)
    const setupToolbar = () => {
      const u = this.user();
      const commands: ToolbarCommand[] = [
        {
          id: 'clearlog',
          icon: 'delete',
          tooltip: 'Clear log',
          action: () => this.onClearLog(),
        },
        {
          id: 'restart',
          icon: 'settings_backup_restore',
          tooltip: 'Restart service',
          action: () => this.onRestart(),
        },
        { type: 'separator' },
        {
          id: 'editor',
          icon: 'edit',
          tooltip: 'Service editor',
          action: () => this.router.navigate(['/editor', this.serviceId]),
        },
        {
          id: 'services',
          icon: 'view_module',
          tooltip: 'My services list',
          action: () => this.router.navigate(['/services']),
        },
        { type: 'separator' },
        ...(u?.role === 'admin'
          ? [
              {
                id: 'management',
                icon: 'settings',
                tooltip: 'Management',
                action: () => this.router.navigate(['/management']),
              } as ToolbarCommand,
            ]
          : []),
        {
          id: 'logout',
          icon: 'power_settings_new',
          tooltip: 'Logout',
          action: () => this.store.dispatch(logout()),
        },
      ];
      this.toolbarService.set(commands);
    };
    setupToolbar();

    // initial load + start polling
    this.loadLogs(false);
    this.pollTimer = setInterval(() => this.loadLogs(true), POLL_MS);

    this.destroyRef.onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.toolbarService.setForceLow(false);
      this.toolbarService.clear();
    });
  }

  ngOnDestroy(): void { /* lifecycle hook so interval is cleared via destroyRef */ }

  // ── data loading ──────────────────────────────────────────────────────────

  private loadLogs(incremental: boolean): void {
    // incremental: only fetch logs newer than what we've already seen
    const last = incremental && this.lastTime > 0 ? this.lastTime + 1 : undefined;

    this.api
      .getLogs(this.serviceId, last)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newItems) => {
          if (newItems.length === 0) return;
          const maxTime = Math.max(...newItems.map((i) => i.time));
          if (maxTime > this.lastTime) this.lastTime = maxTime;
          if (incremental) {
            // prepend newest items, keep full list sorted newest-first
            this.items.update((prev) => [...newItems, ...prev]);
          } else {
            this.items.set(newItems);
          }
        },
      });
  }

  // ── actions ───────────────────────────────────────────────────────────────

  onSelectItem(item: ILogItem): void {
    this.selectedItem.set(this.selectedItem()?._id === item._id ? null : item);
  }

  onCloseDetail(): void {
    this.selectedItem.set(null);
  }

  onClearSearch(): void {
    this.search.set('');
  }

  onClearLog(): void {
    const data: ConfirmDialogData = {
      title: 'Clear log',
      message: 'This will permanently delete all log entries for your account. Continue?',
      confirmLabel: 'Clear',
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.api
          .clearLogs()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.items.set([]);
              this.selectedItem.set(null);
              this.lastTime = 0;
              this.snackBar.open('Log cleared', undefined, { duration: 2000 });
            },
            error: () =>
              this.snackBar.open('Failed to clear log', 'Close', { duration: 3000 }),
          });
      });
  }

  onRestart(): void {
    this.api
      .restartService(this.serviceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.snackBar.open('Service restarted', undefined, { duration: 2000 }),
        error: () =>
          this.snackBar.open('Failed to restart service', 'Close', { duration: 3000 }),
      });
  }
}
