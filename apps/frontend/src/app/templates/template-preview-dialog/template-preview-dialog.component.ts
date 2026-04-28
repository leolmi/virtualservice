import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { ITemplateItem } from '../store/templates.state';

export interface TemplatePreviewDialogData {
  template: ITemplateItem;
  /** Se true mostra il bottone "Install" che chiude il dialog con `true` */
  canInstall?: boolean;
}

@Component({
  selector: 'vs-template-preview-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <span class="title">{{ data.template.title }}</span>
      <span class="author">by {{ data.template.ownerEmail }}</span>
    </h2>

    <mat-dialog-content class="content">
      <p class="description">{{ data.template.description || '—' }}</p>

      @if (data.template.tags.length) {
        <mat-chip-set class="tags">
          @for (t of data.template.tags; track t) {
            <mat-chip disabled>{{ t }}</mat-chip>
          }
        </mat-chip-set>
      }

      <div class="meta">
        <span><mat-icon>folder</mat-icon> {{ data.template.calls.length }} calls</span>
        @if (data.template.dbo) {
          <span><mat-icon>storage</mat-icon> includes shared db</span>
        }
        @if (data.template.schedulerFn) {
          <span><mat-icon>schedule</mat-icon> includes scheduler ({{ data.template.interval }}s)</span>
        }
        <span><mat-icon>download</mat-icon> {{ data.template.installs }} installs</span>
      </div>

      <mat-tab-group>
        <mat-tab label="Calls">
          <div class="tab-body">
            @for (call of data.template.calls; track $index) {
              <div class="call-item">
                <div class="call-header">
                  <span class="verb verb-{{ call.verb.toLowerCase() }}">{{ call.verb }}</span>
                  <span class="path">/{{ call.path }}</span>
                </div>
                @if (call.description) {
                  <p class="call-description">{{ call.description }}</p>
                }
                @if (call.response) {
                  <details>
                    <summary>response</summary>
                    <pre>{{ call.response }}</pre>
                  </details>
                }
                @if (call.rules.length) {
                  <details>
                    <summary>{{ call.rules.length }} rule(s)</summary>
                    @for (rule of call.rules; track $index) {
                      <div class="rule">
                        <span class="rule-code">{{ rule.code }}</span>
                        <span class="rule-error">{{ rule.error }}</span>
                        <pre>{{ rule.expression }}</pre>
                      </div>
                    }
                  </details>
                }
              </div>
            }
          </div>
        </mat-tab>

        @if (data.template.dbo) {
          <mat-tab label="Database">
            <div class="tab-body">
              <pre class="code-block">{{ data.template.dbo }}</pre>
            </div>
          </mat-tab>
        }

        @if (data.template.schedulerFn) {
          <mat-tab label="Scheduler">
            <div class="tab-body">
              <p class="meta-line">Interval: {{ data.template.interval }}s</p>
              <pre class="code-block">{{ data.template.schedulerFn }}</pre>
            </div>
          </mat-tab>
        }
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Close</button>
      @if (data.canInstall) {
        <button mat-flat-button color="primary" (click)="ref.close(true)">
          <mat-icon>download</mat-icon>
          Install
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    h2[mat-dialog-title] {
      display: flex;
      flex-direction: column;
      gap: 4px;
      .title { font-size: 1.1rem; font-weight: 600; }
      .author { font-size: 0.75rem; color: rgba(38, 50, 56, 0.6); }
    }
    .content { min-width: 540px; max-width: 800px; }
    .description { white-space: pre-wrap; margin: 0 0 12px; }
    .tags { margin-bottom: 12px; }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.8rem;
      color: rgba(38, 50, 56, 0.7);
      margin-bottom: 16px;
      span { display: inline-flex; align-items: center; gap: 4px; }
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .tab-body { padding: 16px 4px; }
    .call-item {
      border: 1px solid rgba(10, 10, 10, 0.08);
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .call-header {
      display: flex;
      gap: 8px;
      align-items: center;
      font-family: monospace;
    }
    .verb {
      font-weight: 700;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 3px;
      color: white;
    }
    .verb-get { background: cornflowerblue; }
    .verb-post { background: #4caf50; }
    .verb-put { background: #ff9800; }
    .verb-patch { background: #9c27b0; }
    .verb-delete { background: #f44336; }
    .path { font-size: 0.85rem; }
    .call-description {
      font-size: 0.8rem;
      color: rgba(38, 50, 56, 0.7);
      margin: 4px 0 0;
    }
    details { margin-top: 6px; font-size: 0.8rem; }
    details summary { cursor: pointer; color: var(--vs-primary); }
    pre, .code-block {
      background: #0a0a0a08;
      padding: 8px;
      border-radius: 3px;
      font-size: 0.75rem;
      max-height: 240px;
      overflow: auto;
      margin: 4px 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .rule {
      margin: 8px 0;
      padding-left: 8px;
      border-left: 2px solid var(--vs-accent);
      .rule-code { font-weight: 700; margin-right: 8px; }
      .rule-error { color: rgba(38, 50, 56, 0.7); }
    }
    .meta-line { font-size: 0.85rem; margin: 0 0 8px; }
  `],
})
export class TemplatePreviewDialogComponent {
  data: TemplatePreviewDialogData = inject(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<TemplatePreviewDialogComponent, boolean>);
}
