import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface EditEmailDialogData {
  currentEmail: string;
}

@Component({
  selector: 'vs-edit-email-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Change user email</h2>
    <mat-dialog-content>
      <p class="current">Current email: <strong>{{ data.currentEmail }}</strong></p>
      <p class="info">
        The password will be reset and a link to set a new one will be sent to the new address.
      </p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>New email address</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="off" />
          @if (form.controls.email.hasError('email')) {
            <mat-error>Enter a valid email address</mat-error>
          }
          @if (form.controls.email.hasError('required')) {
            <mat-error>Email is required</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button color="primary"
              [disabled]="form.invalid || form.controls.email.value === data.currentEmail"
              (click)="confirm()">
        Update email
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 360px; }
    .current { margin: 0 0 4px; color: #555; font-size: 14px; }
    .info { margin: 0 0 16px; color: #888; font-size: 13px; }
  `],
})
export class EditEmailDialogComponent {
  readonly data = inject<EditEmailDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<EditEmailDialogComponent>);
  private fb = inject(FormBuilder);

  form = this.fb.nonNullable.group({
    email: [this.data.currentEmail, [Validators.required, Validators.email]],
  });

  confirm(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.controls.email.value);
    }
  }
}
