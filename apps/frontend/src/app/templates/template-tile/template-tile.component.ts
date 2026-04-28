import { Component, computed, inject, input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { selectUser } from '../../auth/store/auth.selectors';
import { ITemplateItem } from '../store/templates.state';

@Component({
  selector: 'vs-template-tile',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './template-tile.component.html',
  styleUrl: './template-tile.component.scss',
})
export class TemplateTileComponent {
  template = input.required<ITemplateItem>();

  preview = output<string>();
  install = output<string>();
  delete = output<string>();

  private store = inject(Store);
  private dialog = inject(MatDialog);

  private user = this.store.selectSignal(selectUser);

  /** True se l'utente corrente può eliminare il template (autore o admin) */
  canDelete = computed(() => {
    const u = this.user();
    if (!u) return false;
    return u.role === 'admin' || u._id === this.template().ownerId;
  });

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onCardClick(): void {
    this.preview.emit(this.template()._id);
  }

  onPreview(event: Event): void {
    event.stopPropagation();
    this.preview.emit(this.template()._id);
  }

  onInstall(event: Event): void {
    event.stopPropagation();
    this.install.emit(this.template()._id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    const data: ConfirmDialogData = {
      title: 'Delete Template',
      message: `Delete "${this.template().title}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
    };
    const ref = this.dialog.open(ConfirmDialogComponent, { data });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.delete.emit(this.template()._id);
      }
    });
  }
}
