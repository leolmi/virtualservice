import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ToolbarService } from '../../core/services/toolbar.service';
import { ToolbarCommand } from '../../core/models/toolbar-command.model';
import { selectIsLoggedIn } from '../../auth/store/auth.selectors';
import { DiscoverApiService, DiscoverCall } from '../discover.service';

@Component({
  selector: 'vs-discover-page',
  standalone: true,
  imports: [
    FormsModule,
    ClipboardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './discover-page.component.html',
  styleUrl: './discover-page.component.scss',
})
export class DiscoverPageComponent {
  private api = inject(DiscoverApiService);
  private clipboard = inject(Clipboard);
  private snack = inject(MatSnackBar);
  private store = inject(Store);
  private router = inject(Router);
  private toolbar = inject(ToolbarService);

  readonly items = signal<DiscoverCall[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  /** Quando valorizzato, filtra solo le call del servizio specificato (per `_id`). */
  readonly scopedServiceId = signal<string | null>(null);

  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);

  readonly scopedService = computed(() => {
    const id = this.scopedServiceId();
    if (!id) return null;
    const found = this.items().find((c) => c.serviceId === id);
    return found
      ? {
          id: found.serviceId,
          name: found.serviceName,
          description: found.serviceDescription,
          path: found.servicePath,
        }
      : null;
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const scopeId = this.scopedServiceId();
    return this.items().filter((c) => {
      if (scopeId && c.serviceId !== scopeId) return false;
      if (!q) return true;
      if ((c.serviceName ?? '').toLowerCase().includes(q)) return true;
      if ((c.serviceDescription ?? '').toLowerCase().includes(q)) return true;
      if ((c.servicePath ?? '').toLowerCase().includes(q)) return true;
      if ((c.callPath ?? '').toLowerCase().includes(q)) return true;
      if ((c.callDescription ?? '').toLowerCase().includes(q)) return true;
      return false;
    });
  });

  /** Numero di servizi distinti presenti nel risultato corrente (post-filtro). */
  readonly distinctServicesInFilter = computed(() => {
    const ids = new Set<string>();
    for (const c of this.filtered()) ids.add(c.serviceId);
    return ids.size;
  });

  /** Origin in chiaro per costruire le URL invocabili. */
  readonly origin = typeof window !== 'undefined' ? window.location.origin : '';

  constructor() {
    const commands: ToolbarCommand[] = [
      {
        id: 'home',
        icon: 'home',
        tooltip: this.isLoggedIn() ? 'My services' : 'Login',
        action: () =>
          this.router.navigate([this.isLoggedIn() ? '/services' : '/login']),
      },
    ];
    this.toolbar.set(commands);
    inject(DestroyRef).onDestroy(() => this.toolbar.clear());

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load discovery');
        this.loading.set(false);
      },
    });
  }

  fullUrl(c: DiscoverCall): string {
    const callPath = c.callPath?.startsWith('/')
      ? c.callPath.slice(1)
      : c.callPath;
    return `${this.origin}/service/${c.servicePath}/${callPath}`;
  }

  onCopyUrl(c: DiscoverCall): void {
    this.clipboard.copy(this.fullUrl(c));
    this.snack.open('URL copied', 'ok', { duration: 2000 });
  }

  onScopeService(serviceId: string): void {
    this.scopedServiceId.set(serviceId);
  }

  onClearScope(): void {
    this.scopedServiceId.set(null);
  }

  onClearSearch(): void {
    this.search.set('');
  }
}
