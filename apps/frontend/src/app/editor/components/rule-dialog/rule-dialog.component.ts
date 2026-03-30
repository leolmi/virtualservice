import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IServiceCallRule } from '@virtualservice/shared/model';
import { CodeEditorComponent } from '../../../core/components/code-editor/code-editor.component';
import { ExpressionHelpComponent } from '../../../core/components/expression-help/expression-help.component';
import { ExpressionHelpContext } from '../../../core/models/expression-help.model';

// ── HTTP status codes ────────────────────────────────────────────────────────

interface HttpStatusEntry { code: number; label: string; }
interface HttpStatusGroup { category: string; codes: HttpStatusEntry[]; }

export const HTTP_STATUS_GROUPS: HttpStatusGroup[] = [
  {
    category: '2xx — Success',
    codes: [
      { code: 200, label: 'OK' },
      { code: 201, label: 'Created' },
      { code: 202, label: 'Accepted' },
      { code: 204, label: 'No Content' },
    ],
  },
  {
    category: '3xx — Redirection',
    codes: [
      { code: 301, label: 'Moved Permanently' },
      { code: 302, label: 'Found' },
      { code: 304, label: 'Not Modified' },
    ],
  },
  {
    category: '4xx — Client Error',
    codes: [
      { code: 400, label: 'Bad Request' },
      { code: 401, label: 'Unauthorized' },
      { code: 403, label: 'Forbidden' },
      { code: 404, label: 'Not Found' },
      { code: 405, label: 'Method Not Allowed' },
      { code: 408, label: 'Request Timeout' },
      { code: 409, label: 'Conflict' },
      { code: 410, label: 'Gone' },
      { code: 415, label: 'Unsupported Media Type' },
      { code: 422, label: 'Unprocessable Entity' },
      { code: 429, label: 'Too Many Requests' },
    ],
  },
  {
    category: '5xx — Server Error',
    codes: [
      { code: 500, label: 'Internal Server Error' },
      { code: 501, label: 'Not Implemented' },
      { code: 502, label: 'Bad Gateway' },
      { code: 503, label: 'Service Unavailable' },
      { code: 504, label: 'Gateway Timeout' },
    ],
  },
];

// ── dialog data ──────────────────────────────────────────────────────────────

export interface RuleDialogData {
  rule: IServiceCallRule;
  helpContext: ExpressionHelpContext | null;
}

// ── component ────────────────────────────────────────────────────────────────

const WIDTH_NORMAL   = '600px';
const WIDTH_WITH_HELP = '960px';

@Component({
  selector: 'vs-rule-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    CodeEditorComponent,
    ExpressionHelpComponent,
  ],
  templateUrl: './rule-dialog.component.html',
  styleUrl: './rule-dialog.component.scss',
})
export class RuleDialogComponent {
  private dialogRef = inject(MatDialogRef<RuleDialogComponent>);
  private data      = inject<RuleDialogData>(MAT_DIALOG_DATA);

  /** Shallow copy of the incoming rule — edited locally until Done */
  rule: IServiceCallRule = { ...this.data.rule };

  readonly helpContext = this.data.helpContext;
  readonly showHelp    = signal(false);
  readonly statusGroups = HTTP_STATUS_GROUPS;

  toggleHelp(): void {
    const next = !this.showHelp();
    this.showHelp.set(next);
    this.dialogRef.updateSize(next ? WIDTH_WITH_HELP : WIDTH_NORMAL);
  }

  onExpressionChange(value: string): void {
    this.rule = { ...this.rule, expression: value };
  }

  close(save = false): void {
    this.dialogRef.close(save ? { ...this.rule } : null);
  }

  getLabel(code: number): string {
    for (const group of HTTP_STATUS_GROUPS) {
      const entry = group.codes.find((s) => s.code === code);
      if (entry) return entry.label;
    }
    return '';
  }
}
