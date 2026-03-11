import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { selectEditorService } from '../store/editor.selectors';
import * as EditorActions from '../store/editor.actions';

/** Default interval (seconds) when the toggle is switched ON */
const DEFAULT_INTERVAL = 10;

@Component({
  selector: 'vs-editor-function',
  standalone: true,
  imports: [
    FormsModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './function.component.html',
  styleUrl: './function.component.scss',
})
export class FunctionComponent {
  private store = inject(Store);

  readonly service = this.store.selectSignal(selectEditorService);

  /** True when the scheduled function is active (interval >= 1) */
  readonly active = computed(() => (this.service()?.interval ?? 0) >= 1);

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
