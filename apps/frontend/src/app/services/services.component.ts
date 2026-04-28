import { Component, DestroyRef, inject } from '@angular/core';
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
  readonly starredServices = this.store.selectSignal(selectStarredServices);
  readonly otherServices = this.store.selectSignal(selectOtherServices);

  readonly dropFileTypes = DROP_FILE_TYPES;

  isDragOver = false;

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
