import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DROP_FILE_TYPES } from '../core/constants/drop-file-types';
import { ToolbarService } from '../core/services/toolbar.service';
import { ToolbarCommand } from '../core/models/toolbar-command.model';
import { selectUser } from '../auth/store/auth.selectors';
import { logout } from '../auth/store/auth.actions';
import {
  selectStarredServices,
  selectOtherServices,
  selectServicesLoading,
  selectServicesError,
} from './store/services.selectors';
import {
  loadServices,
  saveService,
  deleteService,
  createService,
} from './store/services.actions';
import { IServiceItem } from './store/services.state';
import { ServiceTileComponent } from './service-tile/service-tile.component';

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
  private toolbarService = inject(ToolbarService);
  private snackBar = inject(MatSnackBar);

  readonly loading = this.store.selectSignal(selectServicesLoading);
  readonly error = this.store.selectSignal(selectServicesError);
  readonly starredServices = this.store.selectSignal(selectStarredServices);
  readonly otherServices = this.store.selectSignal(selectOtherServices);

  readonly dropFileTypes = DROP_FILE_TYPES;

  isDragOver = false;

  constructor() {
    this.store.dispatch(loadServices());
    this.setupToolbar();
    inject(DestroyRef).onDestroy(() => this.toolbarService.clear());
  }

  private setupToolbar(): void {
    const user = this.store.selectSignal(selectUser)();
    const commands: ToolbarCommand[] = [];

    if (user?.role === 'admin') {
      commands.push({
        id: 'management',
        icon: 'settings',
        tooltip: 'Management',
        action: () => this.router.navigate(['/management']),
      });
      commands.push({ type: 'separator' });
    }

    commands.push({
      id: 'help',
      icon: 'help_outline',
      tooltip: 'Help',
      action: () => this.router.navigate(['/help']),
    });
    commands.push({ type: 'separator' });
    commands.push({
      id: 'logout',
      icon: 'power_settings_new',
      tooltip: 'Logout',
      action: () => this.store.dispatch(logout()),
    });

    this.toolbarService.set(commands);
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

  onGoToHelp(): void {
    this.router.navigate(['/help']);
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
    // File parsing (curl/har/swagger/postman) — not yet implemented
    this.snackBar.open('File import coming soon', 'Close', { duration: 3000 });
  }
}
