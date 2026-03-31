import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface SendMailDialogData {
  /** Numero di destinatari selezionati (0 = tutti) */
  recipientCount: number;
  /** Etichetta descrittiva dei destinatari */
  recipientLabel: string;
}

export interface SendMailDialogResult {
  subject: string;
  body: string;
}

@Component({
  selector: 'vs-send-mail-dialog',
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
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">email</mat-icon>
      Send email
    </h2>
    <mat-dialog-content>
      <p class="recipient-info">
        <mat-icon class="info-icon">group</mat-icon>
        Recipients: <strong>{{ data.recipientLabel }}</strong>
      </p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Subject</mat-label>
        <input matInput
               [(ngModel)]="subject"
               placeholder="Email subject..."
               maxlength="200" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Body</mat-label>
        <textarea matInput
                  [(ngModel)]="body"
                  placeholder="Write the email content..."
                  rows="10"
                  cdkTextareaAutosize
                  cdkAutosizeMinRows="6"
                  cdkAutosizeMaxRows="16"></textarea>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-flat-button
              color="primary"
              [disabled]="!isValid()"
              (click)="send()">
        <mat-icon>send</mat-icon>
        Send
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 400px;
      max-width: 600px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      color: var(--vs-primary, cornflowerblue);
    }

    .recipient-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 16px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 6px;
    }

    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.4);
    }

    .full-width {
      width: 100%;
    }

    button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }
  `],
})
export class SendMailDialogComponent {
  readonly data = inject<SendMailDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SendMailDialogComponent>);

  subject = '';
  body = '';

  isValid(): boolean {
    return this.subject.trim().length > 0 && this.body.trim().length > 0;
  }

  send(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({
      subject: this.subject.trim(),
      body: this.body.trim(),
    } satisfies SendMailDialogResult);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
