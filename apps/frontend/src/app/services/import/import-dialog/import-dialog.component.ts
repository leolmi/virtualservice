import { Component, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ParsedImport,
  ParsedOperation,
  ParsedServiceGroup,
} from '@virtualservice/shared/utils';

// ── Dialog data & result ────────────────────────────────────────────────────

export interface ImportDialogData {
  parsed: ParsedImport;
  parserLabel: string;
}

export interface ImportDialogResult {
  selected: Set<ParsedOperation>;
}

// ── Verb colour helper ──────────────────────────────────────────────────────

const VERB_COLORS: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e',
  HEAD: '#9012fe',
  OPTIONS: '#0d5aa7',
};

// ── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'vs-import-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">upload_file</mat-icon>
      Import services
    </h2>

    <mat-dialog-content>
      <div class="import-meta">
        <span class="meta-label">{{ data.parserLabel }}</span>
        <span class="meta-title">{{ data.parsed.title }}</span>
        @if (data.parsed.version) {
          <span class="meta-version">v{{ data.parsed.version }}</span>
        }
      </div>
      @if (data.parsed.description) {
        <p class="import-desc">{{ data.parsed.description }}</p>
      }

      <div class="select-all-row">
        <mat-checkbox
          [checked]="allSelected()"
          [indeterminate]="someSelected() && !allSelected()"
          (change)="toggleAll($event.checked)">
          Select all ({{ totalOps }} operations)
        </mat-checkbox>
      </div>

      <div class="groups">
        @for (group of data.parsed.groups; track group.name) {
          <div class="group">
            <div class="group-header">
              <mat-checkbox
                [checked]="isGroupSelected(group)"
                [indeterminate]="isGroupIndeterminate(group)"
                (change)="toggleGroup(group, $event.checked)">
                <span class="group-name">{{ group.name }}</span>
                <span class="group-count">({{ group.operations.length }})</span>
              </mat-checkbox>
            </div>

            <div class="operations">
              @for (op of group.operations; track opId(op)) {
                <div class="operation-row">
                  <mat-checkbox
                    [checked]="isSelected(op)"
                    (change)="toggleOp(op, $event.checked)">
                    <span class="verb" [style.background]="verbColor(op.method)">{{ op.method }}</span>
                    <span class="op-path">{{ op.path }}</span>
                  </mat-checkbox>
                  @if (op.summary) {
                    <span class="op-summary" [matTooltip]="op.description || op.summary">{{ op.summary }}</span>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary"
              [disabled]="selectedCount() === 0"
              (click)="onImport()">
        Import {{ selectedCount() }} operation{{ selectedCount() === 1 ? '' : 's' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;

      .title-icon {
        color: var(--vs-primary);
      }
    }

    mat-dialog-content {
      min-width: min(520px, 80vw);
      max-height: 60vh;
    }

    .import-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .meta-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: white;
      background: var(--vs-primary, cornflowerblue);
      padding: 2px 8px;
      border-radius: 3px;
    }

    .meta-title {
      font-weight: 500;
      font-size: 0.95rem;
    }

    .meta-version {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.45);
    }

    .import-desc {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.55);
      margin: 4px 0 0;
      line-height: 1.4;
    }

    .select-all-row {
      margin: 16px 0 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .groups {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .group-header {
      margin-bottom: 4px;
    }

    .group-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .group-count {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.4);
      margin-left: 2px;
    }

    .operations {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-left: 28px;
    }

    .operation-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
    }

    .verb {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      font-family: monospace;
      color: white;
      padding: 1px 6px;
      border-radius: 3px;
      min-width: 52px;
      text-align: center;
    }

    .op-path {
      font-family: monospace;
      font-size: 0.82rem;
    }

    .op-summary {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.4);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }
  `],
})
export class ImportDialogComponent {
  readonly data = inject<ImportDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ImportDialogComponent>);

  private readonly selected = signal(new Set<ParsedOperation>());

  readonly totalOps = this.data.parsed.groups.reduce(
    (sum, g) => sum + g.operations.length, 0,
  );

  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(() => this.selected().size === this.totalOps);
  readonly someSelected = computed(() => this.selected().size > 0);

  constructor() {
    // Start with all selected
    const all = new Set<ParsedOperation>();
    for (const g of this.data.parsed.groups) {
      for (const op of g.operations) all.add(op);
    }
    this.selected.set(all);
  }

  isSelected(op: ParsedOperation): boolean {
    return this.selected().has(op);
  }

  isGroupSelected(group: ParsedServiceGroup): boolean {
    return group.operations.every((op) => this.selected().has(op));
  }

  isGroupIndeterminate(group: ParsedServiceGroup): boolean {
    const sel = group.operations.filter((op) => this.selected().has(op)).length;
    return sel > 0 && sel < group.operations.length;
  }

  toggleOp(op: ParsedOperation, checked: boolean): void {
    this.selected.update((set) => {
      const next = new Set(set);
      checked ? next.add(op) : next.delete(op);
      return next;
    });
  }

  toggleGroup(group: ParsedServiceGroup, checked: boolean): void {
    this.selected.update((set) => {
      const next = new Set(set);
      for (const op of group.operations) {
        checked ? next.add(op) : next.delete(op);
      }
      return next;
    });
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      const all = new Set<ParsedOperation>();
      for (const g of this.data.parsed.groups) {
        for (const op of g.operations) all.add(op);
      }
      this.selected.set(all);
    } else {
      this.selected.set(new Set());
    }
  }

  verbColor(method: string): string {
    return VERB_COLORS[method] ?? '#888';
  }

  opId(op: ParsedOperation): string {
    return `${op.method}-${op.path}`;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onImport(): void {
    this.dialogRef.close({ selected: this.selected() } satisfies ImportDialogResult);
  }
}
