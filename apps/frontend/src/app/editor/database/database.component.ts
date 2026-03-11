import { Component } from '@angular/core';

@Component({
  selector: 'vs-editor-database',
  standalone: true,
  template: `
    <div class="placeholder">
      <span>Service definition — coming soon</span>
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
export class DatabaseComponent {}
