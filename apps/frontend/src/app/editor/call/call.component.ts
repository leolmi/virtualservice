import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpVerb } from '@virtualservice/shared/model';
import { EmptyCallComponent } from '../components/empty-call/empty-call.component';
import {
  selectEditorActiveCall,
  selectEditorService,
} from '../store/editor.selectors';
import * as EditorActions from '../store/editor.actions';

@Component({
  selector: 'vs-editor-call',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    EmptyCallComponent,
  ],
  templateUrl: './call.component.html',
  styleUrl: './call.component.scss',
})
export class CallComponent {
  private store = inject(Store);

  readonly activeCall = this.store.selectSignal(selectEditorActiveCall);
  readonly service = this.store.selectSignal(selectEditorService);

  readonly basePath = computed(() => {
    const svc = this.service();
    return svc ? `./${svc.path}` : './';
  });

  readonly verbs: HttpVerb[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  onUpdateVerb(verb: HttpVerb): void {
    this.store.dispatch(EditorActions.updateActiveCall({ changes: { verb } }));
  }

  onUpdatePath(value: string): void {
    this.store.dispatch(
      EditorActions.updateActiveCall({ changes: { path: value } }),
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
    this.store.dispatch(EditorActions.addRule());
  }

  onDeleteRule(ruleIndex: number): void {
    this.store.dispatch(EditorActions.deleteRule({ ruleIndex }));
  }

  onAddCall(): void {
    this.store.dispatch(EditorActions.addCall());
  }
}
