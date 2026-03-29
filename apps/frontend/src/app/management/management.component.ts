import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToolbarService } from '../core/services/toolbar.service';
import { ManagementService, ManagedUser } from './management.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'vs-management',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss',
})
export class ManagementComponent {
  private router = inject(Router);
  private toolbarService = inject(ToolbarService);
  private managementService = inject(ManagementService);
  private dialog = inject(MatDialog);

  readonly users = signal<ManagedUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly expandedUserId = signal<string | null>(null);
  readonly backing = signal(false);

  constructor() {
    this.toolbarService.set([
      {
        id: 'services',
        icon: 'view_module',
        tooltip: 'My services list',
        action: () => this.router.navigate(['/services']),
      },
    ]);
    inject(DestroyRef).onDestroy(() => this.toolbarService.clear());

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.managementService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Failed to load users');
        this.loading.set(false);
      },
    });
  }

  toggleExpand(userId: string): void {
    this.expandedUserId.update((cur) => (cur === userId ? null : userId));
  }

  onBackup(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Backup Database',
          message: 'Download a complete JSON backup of the entire database?',
          confirmLabel: 'Download',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.backing.set(true);
        this.managementService.backup().subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `virtualservice-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.backing.set(false);
          },
          error: () => this.backing.set(false),
        });
      });
  }

  getAuthMethod(user: ManagedUser): string {
    const hasGoogle = !!user.googleId;
    const hasLocal = !hasGoogle; // se non ha googleId è locale
    // In realtà potrebbe avere entrambi, ma il model non espone `password` al frontend.
    // Se ha googleId lo consideriamo Google OAuth.
    return hasGoogle ? 'Google' : 'Local';
  }
}
