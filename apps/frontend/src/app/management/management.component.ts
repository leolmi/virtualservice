import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatFormFieldModule,
    MatInputModule,
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
  readonly searchQuery = signal('');

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter((u) => u.email.toLowerCase().includes(q));
  });

  readonly deletionCount = computed(
    () => this.filteredUsers().filter((u) => !!u.deletionRequestedAt).length,
  );

  constructor() {
    this.toolbarService.set([
      {
        id: 'backup',
        icon: 'cloud_download',
        tooltip: 'Backup Database',
        enabled: true,
        action: () => this.onBackup(),
      },
      { type: 'separator' },
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
            a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.backing.set(false);
          },
          error: () => this.backing.set(false),
        });
      });
  }

  onDeleteUser(user: ManagedUser): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete user permanently',
          message: `Permanently delete "${user.email}" and all their services? This action cannot be undone.`,
          confirmLabel: 'Delete permanently',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.managementService.deleteUser(user._id).subscribe({
          next: () =>
            this.users.update((list) => list.filter((u) => u._id !== user._id)),
        });
      });
  }

  onRestoreUser(user: ManagedUser): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Restore user',
          message: `Restore access for "${user.email}"? The deletion request will be cancelled.`,
          confirmLabel: 'Restore',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.managementService.restoreUser(user._id).subscribe({
          next: () =>
            this.users.update((list) =>
              list.map((u) =>
                u._id === user._id
                  ? { ...u, deletionRequestedAt: undefined }
                  : u,
              ),
            ),
        });
      });
  }

  onOpenService(svc: { _id: string; }, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/editor', svc._id]);
  }

  onDownloadService(svc: { _id: string; name: string }, event: Event): void {
    event.stopPropagation();
    this.managementService.getService(svc._id).subscribe({
      next: (service) => {
        const filename = svc.name
          .replace(/[^\w\-. ]/g, '_')
          .trim()
          .replace(/\s+/g, '-');
        const json = JSON.stringify(service, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
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
