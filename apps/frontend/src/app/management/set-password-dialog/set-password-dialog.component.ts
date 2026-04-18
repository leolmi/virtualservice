import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SetPasswordDialogData {
  email: string;
}

@Component({
  selector: 'vs-set-password-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Force user password</h2>
    <mat-dialog-content>
      <p class="current">User: <strong>{{ data.email }}</strong></p>
      <p class="info">
        The new password will be set immediately. No email is sent — you must
        communicate it to the user.
      </p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>New password</mat-label>
          <input matInput formControlName="password"
                 [type]="show() ? 'text' : 'password'"
                 autocomplete="new-password" />
          <button mat-icon-button matSuffix type="button"
                  (click)="show.set(!show())"
                  [attr.aria-label]="show() ? 'Hide password' : 'Show password'">
            <mat-icon>{{ show() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) {
            <mat-error>Password is required</mat-error>
          }
          @if (form.controls.password.hasError('minlength')) {
            <mat-error>At least 8 characters</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button color="warn"
              [disabled]="form.invalid"
              (click)="confirm()">
        Set password
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 360px; }
    .current { margin: 0 0 4px; color: #555; font-size: 14px; }
    .info { margin: 0 0 16px; color: #888; font-size: 13px; }
  `],
})
export class SetPasswordDialogComponent {
  readonly data = inject<SetPasswordDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<SetPasswordDialogComponent>);
  private fb = inject(FormBuilder);

  readonly show = signal(false);

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  confirm(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.controls.password.value);
    }
  }
}
