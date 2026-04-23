import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CodeEditorComponent } from '../../../core/components/code-editor/code-editor.component';
import { ExpressionHelpComponent } from '../../../core/components/expression-help/expression-help.component';
import { ExpressionHelpContext } from '../../../core/models/expression-help.model';

export interface ExpressionDialogData {
  title: string;
  expression: string;
  helpContext: ExpressionHelpContext | null;
}

const WIDTH_NORMAL = '600px';
const WIDTH_WITH_HELP = '960px';

@Component({
  selector: 'vs-expression-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CodeEditorComponent,
    ExpressionHelpComponent,
  ],
  templateUrl: './expression-dialog.component.html',
  styleUrl: './expression-dialog.component.scss',
})
export class ExpressionDialogComponent {
  private dialogRef = inject(MatDialogRef<ExpressionDialogComponent>);
  private data = inject<ExpressionDialogData>(MAT_DIALOG_DATA);

  readonly title = this.data.title;
  readonly helpContext = this.data.helpContext;
  readonly showHelp = signal(false);

  expression = this.data.expression;

  toggleHelp(): void {
    const next = !this.showHelp();
    this.showHelp.set(next);
    this.dialogRef.updateSize(next ? WIDTH_WITH_HELP : WIDTH_NORMAL);
  }

  onExpressionChange(value: string): void {
    this.expression = value;
  }

  close(save = false): void {
    this.dialogRef.close(save ? this.expression : null);
  }
}
