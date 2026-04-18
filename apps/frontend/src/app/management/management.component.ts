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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ToolbarService } from '../core/services/toolbar.service';
import { ManagementService, ManagedUser } from './management.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../core/components/confirm-dialog/confirm-dialog.component';
import { SendMailDialogComponent, SendMailDialogData, SendMailDialogResult } from './send-mail-dialog/send-mail-dialog.component';
import { EditEmailDialogComponent, EditEmailDialogData } from './edit-email-dialog/edit-email-dialog.component';
import { SetPasswordDialogComponent, SetPasswordDialogData } from './set-password-dialog/set-password-dialog.component';

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
    MatCheckboxModule,
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
  readonly sending = signal(false);
  readonly searchQuery = signal('');
  readonly selectedUserIds = signal<Set<string>>(new Set());

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter((u) => u.email.toLowerCase().includes(q));
  });

  readonly deletionCount = computed(
    () => this.filteredUsers().filter((u) => !!u.deletionRequestedAt).length,
  );

  readonly selectedCount = computed(() => this.selectedUserIds().size);

  readonly allFilteredSelected = computed(() => {
    const filtered = this.filteredUsers();
    if (filtered.length === 0) return false;
    const sel = this.selectedUserIds();
    return filtered.every((u) => sel.has(u._id));
  });

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

  onResetPassword(user: ManagedUser): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Reset user password',
          message: `Send a password-reset email to "${user.email}"? The current password will be cleared and the user will have to set a new one.`,
          confirmLabel: 'Reset & send email',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.managementService.resetUserPassword(user._id).subscribe({
          next: () => this.notify('Password reset email sent', `A reset link has been sent to ${user.email}.`),
          error: (err) => this.notify('Reset failed', err.error?.message ?? 'Could not reset password'),
        });
      });
  }

  onEditEmail(user: ManagedUser): void {
    this.dialog
      .open(EditEmailDialogComponent, {
        data: { currentEmail: user.email } satisfies EditEmailDialogData,
      })
      .afterClosed()
      .subscribe((newEmail: string | null | undefined) => {
        if (!newEmail || newEmail === user.email) return;
        this.managementService.updateUserEmail(user._id, newEmail).subscribe({
          next: () => {
            this.users.update((list) =>
              list.map((u) =>
                u._id === user._id
                  ? { ...u, email: newEmail, isEmailVerified: true, isMigrated: false }
                  : u,
              ),
            );
            this.notify('Email updated', `A reset link has been sent to ${newEmail}.`);
          },
          error: (err) => this.notify('Update failed', err.error?.message ?? 'Could not update email'),
        });
      });
  }

  onSetPassword(user: ManagedUser): void {
    this.dialog
      .open(SetPasswordDialogComponent, {
        data: { email: user.email } satisfies SetPasswordDialogData,
      })
      .afterClosed()
      .subscribe((password: string | null | undefined) => {
        if (!password) return;
        this.managementService.setUserPassword(user._id, password).subscribe({
          next: () => {
            this.users.update((list) =>
              list.map((u) =>
                u._id === user._id
                  ? { ...u, isEmailVerified: true, isMigrated: false }
                  : u,
              ),
            );
            this.notify('Password set', `A new password has been set for ${user.email}. Communicate it to the user.`);
          },
          error: (err) => this.notify('Set password failed', err.error?.message ?? 'Could not set password'),
        });
      });
  }

  private notify(title: string, message: string): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title,
        message,
        confirmLabel: 'OK',
        cancelLabel: '',
      } satisfies ConfirmDialogData,
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

  toggleSelectUser(userId: string): void {
    this.selectedUserIds.update((set) => {
      const next = new Set(set);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  isSelected(userId: string): boolean {
    return this.selectedUserIds().has(userId);
  }

  toggleSelectAll(): void {
    const filtered = this.filteredUsers();
    if (this.allFilteredSelected()) {
      // Deseleziona tutti i filtrati
      this.selectedUserIds.update((set) => {
        const next = new Set(set);
        filtered.forEach((u) => next.delete(u._id));
        return next;
      });
    } else {
      // Seleziona tutti i filtrati
      this.selectedUserIds.update((set) => {
        const next = new Set(set);
        filtered.forEach((u) => next.add(u._id));
        return next;
      });
    }
  }

  onSendMail(): void {
    const selected = this.selectedUserIds();
    const count = selected.size;
    const totalUsers = this.users().length;
    const recipientLabel = count > 0
      ? `${count} selected user${count > 1 ? 's' : ''}`
      : `All users (${totalUsers})`;

    this.dialog
      .open(SendMailDialogComponent, {
        data: {
          recipientCount: count,
          recipientLabel,
        } satisfies SendMailDialogData,
        width: '540px',
      })
      .afterClosed()
      .subscribe((result: SendMailDialogResult | undefined) => {
        if (!result) return;

        const userIds = count > 0 ? [...selected] : undefined;
        const confirmMsg = count > 0
          ? `Send email to ${count} selected user${count > 1 ? 's' : ''}?`
          : `Send email to ALL ${totalUsers} users?`;

        this.dialog
          .open(ConfirmDialogComponent, {
            data: {
              title: 'Confirm send',
              message: confirmMsg,
              confirmLabel: 'Send',
            } satisfies ConfirmDialogData,
          })
          .afterClosed()
          .subscribe((confirmed) => {
            if (!confirmed) return;
            this.sending.set(true);
            this.managementService
              .sendMail(result.subject, result.body, userIds)
              .subscribe({
                next: (res) => {
                  this.sending.set(false);
                  this.dialog.open(ConfirmDialogComponent, {
                    data: {
                      title: 'Email sent',
                      message: `Successfully sent: ${res.sent}${res.failed > 0 ? `, Failed: ${res.failed}` : ''}`,
                      confirmLabel: 'OK',
                      cancelLabel: '',
                    } satisfies ConfirmDialogData,
                  });
                },
                error: () => this.sending.set(false),
              });
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
