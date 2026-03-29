import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface ChangePasswordDialogData {
  hasPassword: boolean;
}

@Component({
  selector: 'vs-change-password-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.hasPassword ? 'Change password' : 'Set password' }}</h2>

    <mat-dialog-content>
      @if (!data.hasPassword) {
        <p class="hint">Your account uses Google sign-in. Set a password to also log in with email and password.</p>
      }

      @if (data.hasPassword) {
        <mat-form-field appearance="outline">
          <mat-label>Current password</mat-label>
          <input matInput [type]="showCurrent() ? 'text' : 'password'" [(ngModel)]="currentPassword" />
          <button mat-icon-button matSuffix type="button" (click)="showCurrent.set(!showCurrent())">
            <mat-icon>{{ showCurrent() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
        </mat-form-field>
      }

      <mat-form-field appearance="outline">
        <mat-label>New password</mat-label>
        <input matInput [type]="showNew() ? 'text' : 'password'" [(ngModel)]="newPassword" />
        <button mat-icon-button matSuffix type="button" (click)="showNew.set(!showNew())">
          <mat-icon>{{ showNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (newPassword && newPassword.length < 8) {
          <mat-hint class="warn-hint">At least 8 characters</mat-hint>
        }
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Confirm new password</mat-label>
        <input matInput [type]="showConfirm() ? 'text' : 'password'" [(ngModel)]="confirmPassword" />
        <button mat-icon-button matSuffix type="button" (click)="showConfirm.set(!showConfirm())">
          <mat-icon>{{ showConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (confirmPassword && confirmPassword !== newPassword) {
          <mat-hint class="warn-hint">Passwords do not match</mat-hint>
        }
      </mat-form-field>

      @if (errorMessage()) {
        <p class="error-msg">{{ errorMessage() }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancel</button>
      <button mat-flat-button color="primary"
              [disabled]="!isValid() || saving()"
              (click)="onSave()">
        {{ saving() ? 'Saving…' : (data.hasPassword ? 'Change password' : 'Set password') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 340px;
    }
    .hint {
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.55);
      margin: 0 0 8px;
    }
    .warn-hint {
      color: #e65100;
    }
    .error-msg {
      color: #c62828;
      font-size: 0.85rem;
      margin: 4px 0 0;
    }
  `],
})
export class ChangePasswordDialogComponent {
  data = inject<ChangePasswordDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private http = inject(HttpClient);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  isValid(): boolean {
    if (this.data.hasPassword && !this.currentPassword) return false;
    if (!this.newPassword || this.newPassword.length < 8) return false;
    if (this.newPassword !== this.confirmPassword) return false;
    return true;
  }

  onSave(): void {
    this.saving.set(true);
    this.errorMessage.set(null);

    const body: Record<string, string> = { newPassword: this.newPassword };
    if (this.data.hasPassword) {
      body['currentPassword'] = this.currentPassword;
    }

    this.http.patch<{ message: string }>('/users/password', body).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message ?? 'An error occurred');
      },
    });
  }
}
