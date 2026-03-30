import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { HttpVerb, IServiceCallRule } from '@virtualservice/shared/model';
import { EmptyCallComponent } from '../components/empty-call/empty-call.component';
import {
  selectEditorActiveCall,
  selectEditorActiveCallIndex,
  selectEditorService,
  selectServiceBasePath,
} from '../store/editor.selectors';
import * as EditorActions from '../store/editor.actions';
import { RuleDialogComponent, RuleDialogData } from '../components/rule-dialog/rule-dialog.component';
import { CodeEditorComponent } from '../../core/components/code-editor/code-editor.component';
import { calcParameters } from '../../core/models/path.helper';
import { ExpressionHelpComponent } from '../../core/components/expression-help/expression-help.component';
import { ExpressionHelpContext } from '../../core/models/expression-help.model';
import { getScopeContext } from './call.scope';

export interface KvEntry {
  key: string;
  value: string;
}

@Component({
  selector: 'vs-editor-call',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    EmptyCallComponent,
    CodeEditorComponent,
    ExpressionHelpComponent,
  ],
  templateUrl: './call.component.html',
  styleUrl: './call.component.scss',
})
export class CallComponent {
  private store = inject(Store);
  private dialog = inject(MatDialog);

  readonly activeCall = this.store.selectSignal(selectEditorActiveCall);
  readonly activeCallIndex = this.store.selectSignal(selectEditorActiveCallIndex);
  readonly service = this.store.selectSignal(selectEditorService);
  readonly basePath = this.store.selectSignal(selectServiceBasePath);

  readonly verbs: HttpVerb[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  readonly helpOpen = signal(false);
  readonly headersOpen = signal(false);
  readonly cookiesOpen = signal(false);

  readonly helpContext = computed<ExpressionHelpContext | null>(() => {
    const call = this.activeCall();
    const service = this.service();
    return getScopeContext(call, service);
  });

  /**
   * Stato locale delle entries key-value (source of truth per il template).
   * Sincronizzato dallo store solo quando cambia la call selezionata.
   */
  readonly headerEntries = signal<KvEntry[]>([]);
  readonly cookieEntries = signal<KvEntry[]>([]);

  constructor() {
    // Sincronizza dallo store solo quando cambia la call selezionata (indice diverso).
    // activeCallIndex è l'unico segnale tracciato; activeCall è letto con untracked
    // così l'effect NON si re-triggera quando cambiano verb, response, headers, ecc.
    effect(() => {
      this.activeCallIndex();
      const call = untracked(() => this.activeCall());

      this.headerEntries.set(
        call?.headers
          ? Object.entries(call.headers).map(([key, value]) => ({ key, value }))
          : [],
      );
      this.cookieEntries.set(
        call?.cookies
          ? Object.entries(call.cookies).map(([key, value]) => ({ key, value }))
          : [],
      );
    });
  }

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  toggleHeaders(): void {
    this.headersOpen.update((v) => !v);
  }

  toggleCookies(): void {
    this.cookiesOpen.update((v) => !v);
  }

  onUpdateVerb(verb: HttpVerb): void {
    this.store.dispatch(EditorActions.updateActiveCall({ changes: { verb } }));
  }

  onUpdatePath(path: string): void {
    const parameters = calcParameters(path);
    this.store.dispatch(
      EditorActions.updateActiveCall({ changes: { path, parameters } }),
    );
  }

  onUpdateResponse(value: string): void {
    this.store.dispatch(
      EditorActions.updateActiveCall({ changes: { response: value } }),
    );
  }

  onDeleteCall(): void {
    this.store.dispatch(EditorActions.deleteActiveCall());
  }

  onAddRule(): void {
    const newRule: IServiceCallRule = {
      expression: '',
      path: '',
      error: 'Error',
      code: 400,
    };
    const data: RuleDialogData = { rule: newRule, helpContext: this.helpContext() };
    this.dialog
      .open(RuleDialogComponent, { data, width: '600px', maxWidth: '960px' })
      .afterClosed()
      .subscribe((result: IServiceCallRule | null) => {
        if (!result) return;
        this.store.dispatch(EditorActions.addRule({ rule: result }));
      });
  }

  onEditRule(ruleIndex: number): void {
    const call = this.activeCall();
    if (!call) return;
    const data: RuleDialogData = { rule: call.rules[ruleIndex], helpContext: this.helpContext() };
    this.dialog
      .open(RuleDialogComponent, { data, width: '600px', maxWidth: '960px' })
      .afterClosed()
      .subscribe((changes) => {
        if (!changes) return;
        this.store.dispatch(EditorActions.updateRule({ ruleIndex, changes }));
      });
  }

  onDeleteRule(ruleIndex: number): void {
    this.store.dispatch(EditorActions.deleteRule({ ruleIndex }));
  }

  onAddCall(): void {
    this.store.dispatch(EditorActions.addCall());
  }

  // ─── Headers ────────────────────────────────────────────────────────────────

  onAddHeader(): void {
    this.updateHeaderEntries([...this.headerEntries(), { key: '', value: '' }]);
  }

  onUpdateHeader(index: number, field: 'key' | 'value', val: string): void {
    this.updateHeaderEntries(
      this.headerEntries().map((e, i) => (i === index ? { ...e, [field]: val } : e)),
    );
  }

  onDeleteHeader(index: number): void {
    this.updateHeaderEntries(this.headerEntries().filter((_, i) => i !== index));
  }

  // ─── Cookies ────────────────────────────────────────────────────────────────

  onAddCookie(): void {
    this.updateCookieEntries([...this.cookieEntries(), { key: '', value: '' }]);
  }

  onUpdateCookie(index: number, field: 'key' | 'value', val: string): void {
    this.updateCookieEntries(
      this.cookieEntries().map((e, i) => (i === index ? { ...e, [field]: val } : e)),
    );
  }

  onDeleteCookie(index: number): void {
    this.updateCookieEntries(this.cookieEntries().filter((_, i) => i !== index));
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private entriesToRecord(entries: KvEntry[]): Record<string, string> {
    const record: Record<string, string> = {};
    for (const e of entries) {
      const k = e.key.trim();
      if (k) record[k] = e.value;
    }
    return record;
  }

  private updateHeaderEntries(entries: KvEntry[]): void {
    this.headerEntries.set(entries);
    this.store.dispatch(
      EditorActions.updateActiveCall({ changes: { headers: this.entriesToRecord(entries) } }),
    );
  }

  private updateCookieEntries(entries: KvEntry[]): void {
    this.cookieEntries.set(entries);
    this.store.dispatch(
      EditorActions.updateActiveCall({ changes: { cookies: this.entriesToRecord(entries) } }),
    );
  }
}
