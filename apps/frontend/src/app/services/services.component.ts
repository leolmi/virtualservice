import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  selectOtherServices,
  selectServicesError,
  selectServicesLoading,
  selectStarredServices,
} from './store/services.selectors';
import {
  createService,
  deleteService,
  loadServices,
  saveService,
} from './store/services.actions';
import { IServiceItem } from './store/services.state';
import { ServiceTileComponent } from './service-tile/service-tile.component';
import { DROP_FILE_TYPES } from '@virtualservice/shared/model';
import { ViewportScroller } from '@angular/common';
import { take } from 'rxjs';

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

  readonly loading = this.store.selectSignal(selectServicesLoading);
  readonly error = this.store.selectSignal(selectServicesError);
  readonly starredServices = this.store.selectSignal(selectStarredServices);
  readonly otherServices = this.store.selectSignal(selectOtherServices);

  readonly dropFileTypes = DROP_FILE_TYPES;

  isDragOver = false;

  constructor() {
    this.store.dispatch(loadServices());
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
    // File parsing (curl/har/swagger/postman) — not yet implemented
    this.snackBar.open('File import coming soon', 'Close', { duration: 3000 });
  }
}
