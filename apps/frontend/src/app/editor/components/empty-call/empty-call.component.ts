import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DROP_FILE_TYPES } from '../../../core/constants/drop-file-types';
import { selectEditorService } from '../../store/editor.selectors';
import * as EditorActions from '../../store/editor.actions';

@Component({
  selector: 'vs-empty-call',
  standalone: true,
  templateUrl: './empty-call.component.html',
  styleUrl: './empty-call.component.scss',
})
export class EmptyCallComponent {
  private store = inject(Store);

  private service = this.store.selectSignal(selectEditorService);

  readonly callsCount = computed(() => this.service()?.calls.length ?? 0);

  readonly dropFileTypes = DROP_FILE_TYPES;

  onCreateCall(): void {
    this.store.dispatch(EditorActions.addCall());
  }
}
