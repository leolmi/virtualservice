import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { selectEditorService } from '../store/editor.selectors';
import * as EditorActions from '../store/editor.actions';
import { CodeEditorComponent } from '../../core/components/code-editor/code-editor.component';
import { ExpressionHelpComponent } from '../../core/components/expression-help/expression-help.component';
import { ExpressionHelpContext } from '../../core/models/expression-help.model';
import { getScopeContext } from './function.scope';

/** Default interval (seconds) when the toggle is switched ON */
const DEFAULT_INTERVAL = 10;

@Component({
  selector: 'vs-editor-function',
  standalone: true,
  imports: [
    FormsModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    CodeEditorComponent,
    ExpressionHelpComponent,
  ],
  templateUrl: './function.component.html',
  styleUrl: './function.component.scss',
})
export class FunctionComponent {
  private store = inject(Store);

  readonly service = this.store.selectSignal(selectEditorService);

  /** True when the scheduled function is active (interval >= 1) */
  readonly active = computed(() => (this.service()?.interval ?? 0) >= 1);

  readonly helpOpen = signal(false);

  readonly helpContext = computed<ExpressionHelpContext | null>(() => {
    const service = this.service();
    return getScopeContext(service);
  });

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  onToggleActive(enabled: boolean): void {
    this.store.dispatch(
      EditorActions.updateService({
        changes: { interval: enabled ? DEFAULT_INTERVAL : 0 },
      }),
    );
  }

  onIntervalChange(value: number): void {
    // clamp to [0, 10000]
    const clamped = Math.max(0, Math.min(10_000, value || 0));
    this.store.dispatch(
      EditorActions.updateService({ changes: { interval: clamped } }),
    );
  }

  onSchedulerFnChange(value: string): void {
    this.store.dispatch(
      EditorActions.updateService({ changes: { schedulerFn: value } }),
    );
  }
}
