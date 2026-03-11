import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { IServiceCallRule } from '@virtualservice/shared/model';
import { CodeEditorComponent } from '../../../core/components/code-editor/code-editor.component';

@Component({
  selector: 'vs-rule-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    CodeEditorComponent,
  ],
  templateUrl: './rule-dialog.component.html',
  styleUrl: './rule-dialog.component.scss',
})
export class RuleDialogComponent {
  private dialogRef = inject(MatDialogRef<RuleDialogComponent>);

  /** Shallow copy of the incoming rule — edited locally until Done */
  rule: IServiceCallRule = { ...inject<IServiceCallRule>(MAT_DIALOG_DATA) };

  onExpressionChange(value: string): void {
    this.rule = { ...this.rule, expression: value };
  }

  close(save = false): void {
    this.dialogRef.close(save ? { ...this.rule } : null);
  }
}
