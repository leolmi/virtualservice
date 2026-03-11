import { Component } from '@angular/core';

@Component({
  selector: 'vs-editor-function',
  standalone: true,
  template: `
    <div class="placeholder">
      <span>Timed function — coming soon</span>
    </div>
  `,
  styles: [
    `
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
export class FunctionComponent {}
