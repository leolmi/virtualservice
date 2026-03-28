import { Component, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkdownPipe } from '../../core/pipes/markdown.pipe';
import { selectEditorService } from '../store/editor.selectors';
import * as EditorActions from '../store/editor.actions';
import { CodeEditorComponent } from '../../core/components/code-editor/code-editor.component';
import { ExpressionHelpComponent } from '../../core/components/expression-help/expression-help.component';
import { ExpressionHelpContext } from '../../core/models/expression-help.model';
import { getScopeContext } from './database.scope';

/** Max characters allowed in the dbo field */
const DBO_MAX_LENGTH = 100_000;

@Component({
  selector: 'vs-editor-database',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MarkdownPipe,
    CodeEditorComponent,
    ExpressionHelpComponent,
  ],
  templateUrl: './database.component.html',
  styleUrl: './database.component.scss',
})
export class DatabaseComponent {
  private store = inject(Store);

  readonly service = this.store.selectSignal(selectEditorService);

  /** Whether the description textarea is shown instead of the rendered markdown */
  readonly editDescription = signal(false);

  readonly helpOpen = signal(false);

  /** Warning message when dbo exceeds the max length */
  readonly dboWarning = computed<string | null>(() => {
    const len = (this.service()?.dbo ?? '').length;
    return len > DBO_MAX_LENGTH
      ? `Database overflow! The database must contain up to ${DBO_MAX_LENGTH.toLocaleString()} characters (currently ${len.toLocaleString()}).`
      : null;
  });

  readonly helpContext = computed<ExpressionHelpContext | null>(() => {
    const service = this.service();
    return getScopeContext(service);
  });

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  onToggleEditDescription(): void {
    this.editDescription.update((v) => !v);
  }

  onUpdateDescription(value: string): void {
    this.store.dispatch(
      EditorActions.updateService({ changes: { description: value } }),
    );
  }

  onUpdateDbo(value: string): void {
    this.store.dispatch(
      EditorActions.updateService({ changes: { dbo: value } }),
    );
  }
}
