import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'vs-generate-api-key-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Generate API key</h2>
    <mat-dialog-content>
      <p class="hint">
        Choose a label that helps you recognise where this key is used
        (e.g. "Claude Desktop laptop"). The secret will be shown only once.
      </p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input
          matInput
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
          maxlength="80"
          autocomplete="off"
          autofocus
        />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!canApply()"
        (click)="apply()"
      >
        Generate
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .hint {
        margin: 0 0 16px;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class GenerateApiKeyDialogComponent {
  private dialogRef = inject(
    MatDialogRef<GenerateApiKeyDialogComponent, string | null>,
  );

  readonly name = signal('');
  readonly canApply = computed(() => this.name().trim().length > 0);

  apply(): void {
    if (!this.canApply()) return;
    this.dialogRef.close(this.name().trim());
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
