import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ShowSecretDialogData {
  /** Stringa completa `vsk_<prefix>_<secret>` da mostrare una volta sola. */
  secret: string;
  /** Nome assegnato dall'utente, mostrato come contesto. */
  keyName: string;
}

@Component({
  selector: 'vs-show-secret-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>API key generated</h2>
    <mat-dialog-content>
      <p class="warning">
        <mat-icon>warning</mat-icon>
        This is the only time the full key will be shown. Copy it now and
        store it somewhere safe — if you lose it you'll need to revoke and
        generate a new one.
      </p>
      <p class="key-name">Key: <strong>{{ data.keyName }}</strong></p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Secret</mat-label>
        <input
          matInput
          readonly
          [value]="data.secret"
          (focus)="$any($event.target).select()"
        />
        <button
          mat-icon-button
          matSuffix
          [matTooltip]="copied() ? 'Copied' : 'Copy'"
          (click)="copy()"
          aria-label="Copy"
          type="button"
        >
          <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
        </button>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="close()">Done</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        margin: 0 0 16px;
        padding: 12px;
        border-radius: 6px;
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
        font-size: 0.875rem;
        line-height: 1.4;
      }
      .warning mat-icon {
        flex: 0 0 auto;
      }
      .key-name {
        margin: 0 0 12px;
        font-size: 0.875rem;
      }
      .full-width {
        width: 100%;
      }
      :host ::ng-deep .mat-mdc-form-field-icon-suffix {
        padding-right: 4px;
      }
    `,
  ],
})
export class ShowSecretDialogComponent {
  readonly data = inject<ShowSecretDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ShowSecretDialogComponent>);

  readonly copied = signal(false);

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data.secret);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback: select handled by input focus, user can ctrl+c manually
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
