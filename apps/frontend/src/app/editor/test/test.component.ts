import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { inject } from '@angular/core';
import { EmptyCallComponent } from '../components/empty-call/empty-call.component';
import { selectEditorActiveCall } from '../store/editor.selectors';

@Component({
  selector: 'vs-editor-test',
  standalone: true,
  imports: [EmptyCallComponent],
  template: `
    @if (activeCall()) {
      <div class="placeholder">
        <span>Call test — coming soon</span>
      </div>
    } @else {
      <vs-empty-call />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 1rem;
        color: rgba(0, 0, 0, 0.35);
      }
    `,
  ],
})
export class TestComponent {
  private store = inject(Store);
  readonly activeCall = this.store.selectSignal(selectEditorActiveCall);
}
