import { Component, inject, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { IServiceItem } from '../store/services.state';

@Component({
  selector: 'vs-service-tile',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
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
  downloadSwagger = output<string>();

  private dialog = inject(MatDialog);

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

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

  onDownloadSwagger(event: Event): void {
    event.stopPropagation();
    this.downloadSwagger.emit(this.service()._id);
  }
}
