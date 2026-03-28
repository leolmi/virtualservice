import { Component, computed, inject, signal } from '@angular/core';
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
  selectEditorService,
  selectServiceBasePath,
} from '../store/editor.selectors';
import * as EditorActions from '../store/editor.actions';
import { RuleDialogComponent } from '../components/rule-dialog/rule-dialog.component';
import { CodeEditorComponent } from '../../core/components/code-editor/code-editor.component';
import { calcParameters } from '../../core/models/path.helper';
import { ExpressionHelpComponent } from '../../core/components/expression-help/expression-help.component';
import { ExpressionHelpContext } from '../../core/models/expression-help.model';
import { getScopeContext } from './call.scope';

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
  readonly service = this.store.selectSignal(selectEditorService);
  readonly basePath = this.store.selectSignal(selectServiceBasePath);

  readonly verbs: HttpVerb[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  readonly helpOpen = signal(false);

  readonly helpContext = computed<ExpressionHelpContext | null>(() => {
    const call = this.activeCall();
    const service = this.service();

    return getScopeContext(call, service);
  });

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
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
    this.dialog
      .open(RuleDialogComponent, { data: newRule, width: '600px' })
      .afterClosed()
      .subscribe((result: IServiceCallRule | null) => {
        if (!result) return;
        this.store.dispatch(EditorActions.addRule({ rule: result }));
      });
  }

  onEditRule(ruleIndex: number): void {
    const call = this.activeCall();
    if (!call) return;
    const rule = call.rules[ruleIndex];
    this.dialog
      .open(RuleDialogComponent, { data: rule, width: '600px' })
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
}
