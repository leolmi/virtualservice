import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ToolbarService } from '../core/services/toolbar.service';
import { ToolbarCommand } from '../core/models/toolbar-command.model';
import {
  selectOtherServices,
  selectServices,
  selectServicesError,
  selectServicesLoading,
  selectStarredServices,
} from './store/services.selectors';
import {
  createService,
  deleteService,
  importServices,
  loadServices,
  saveService,
} from './store/services.actions';
import { IServiceItem } from './store/services.state';
import { ServiceTileComponent } from './service-tile/service-tile.component';
import { DROP_FILE_TYPES } from '@virtualservice/shared/model';
import { parseImportFile } from './import/file-parser-registry';
import { convertToServices } from './import/import-converter';
import {
  ImportDialogComponent,
  ImportDialogData,
  ImportDialogResult,
} from './import/import-dialog/import-dialog.component';

@Component({
  selector: 'vs-services',
  standalone: true,
  imports: [
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    ServiceTileComponent,
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  private store = inject(Store);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private toolbar = inject(ToolbarService);

  readonly loading = this.store.selectSignal(selectServicesLoading);
  readonly error = this.store.selectSignal(selectServicesError);
  private readonly allServices = this.store.selectSignal(selectServices);
  private readonly rawStarred = this.store.selectSignal(selectStarredServices);
  private readonly rawOther = this.store.selectSignal(selectOtherServices);

  readonly search = signal('');

  readonly starredServices = computed(() => this._applySearch(this.rawStarred()));
  readonly otherServices = computed(() => this._applySearch(this.rawOther()));
  readonly hasAnyService = computed(() => this.allServices().length > 0);
  readonly totalCount = computed(() => this.allServices().length);
  readonly visibleCount = computed(
    () => this.starredServices().length + this.otherServices().length,
  );
  readonly isFiltering = computed(() => this.search().trim().length > 0);

  readonly dropFileTypes = DROP_FILE_TYPES;

  isDragOver = false;

  private _applySearch(items: IServiceItem[]): IServiceItem[] {
    const q = this.search().trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => {
      if ((s.name ?? '').toLowerCase().includes(q)) return true;
      if ((s.description ?? '').toLowerCase().includes(q)) return true;
      if ((s.path ?? '').toLowerCase().includes(q)) return true;
      const calls = s.calls ?? [];
      for (const c of calls) {
        if ((c.path ?? '').toLowerCase().includes(q)) return true;
        if ((c.description ?? '').toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }

  constructor() {
    this.store.dispatch(loadServices());

    const commands: ToolbarCommand[] = [
      {
        id: 'templates',
        icon: 'collections_bookmark',
        tooltip: 'Public templates',
        action: () => this.router.navigate(['/templates']),
      },
    ];
    this.toolbar.set(commands);

    inject(DestroyRef).onDestroy(() => this.toolbar.clear());
  }

  onToggleActive(service: IServiceItem): void {
    this.store.dispatch(saveService({ service }));
  }

  onToggleStarred(service: IServiceItem): void {
    this.store.dispatch(saveService({ service }));
  }

  onDeleteService(id: string): void {
    this.store.dispatch(deleteService({ id }));
  }

  onOpenService(id: string): void {
    this.router.navigate(['/editor', id, 'call']);
  }

  onMonitorService(id: string): void {
    this.router.navigate(['/monitor', id]);
  }

  onCreateService(): void {
    this.store.dispatch(createService());
  }

  onClearSearch(): void {
    this.search.set('');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      try {
        const result = parseImportFile(content, file.name);
        this.openImportDialog(result.data, result.parserLabel);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    };
    reader.onerror = () => {
      this.snackBar.open('Failed to read file', 'Close', { duration: 3000 });
    };
    reader.readAsText(file);
  }

  private openImportDialog(parsed: ImportDialogData['parsed'], parserLabel: string): void {
    this.dialog
      .open(ImportDialogComponent, {
        data: { parsed, parserLabel } satisfies ImportDialogData,
        width: '640px',
        maxHeight: '80vh',
      })
      .afterClosed()
      .subscribe((result: ImportDialogResult | null) => {
        if (!result || result.selected.size === 0) return;

        const services = convertToServices(parsed, result.selected);
        if (services.length === 0) {
          this.snackBar.open('No compatible operations to import', 'Close', { duration: 3000 });
          return;
        }

        this.store.dispatch(importServices({ services }));
        this.snackBar.open(
          `Importing ${services.length} service${services.length > 1 ? 's' : ''}…`,
          undefined,
          { duration: 2000 },
        );
      });
  }
}
