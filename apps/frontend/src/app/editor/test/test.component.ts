import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

import { EmptyCallComponent } from '../components/empty-call/empty-call.component';
import {
  selectEditorActiveCall,
  selectEditorService,
} from '../store/editor.selectors';
import * as EditorActions from '../store/editor.actions';
import { HttpVerb, IServiceCallParameter } from '@virtualservice/shared/model';

const VERBS_WITH_BODY: HttpVerb[] = ['POST', 'PUT', 'PATCH'];

export interface PathSegment {
  text: string;
  isParam: boolean;
  paramName?: string;
}

import { CodeEditorComponent } from '../../core/components/code-editor/code-editor.component';

@Component({
  selector: 'vs-editor-test',
  standalone: true,
  imports: [
    EmptyCallComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatSnackBarModule,
    FormsModule,
    CodeEditorComponent,
  ],
  templateUrl: './test.component.html',
  styleUrl: './test.component.scss',
})
export class TestComponent {
  private store = inject(Store);
  private http = inject(HttpClient);
  private clipboard = inject(Clipboard);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly activeCall = this.store.selectSignal(selectEditorActiveCall);
  readonly service = this.store.selectSignal(selectEditorService);

  readonly testing = signal(false);
  readonly results = signal<unknown>(null);
  readonly isError = signal(false);
  readonly editDescription = signal(false);
  readonly activeParamName = signal<string | null>(null);

  readonly basePath = computed(() => {
    const svc = this.service();
    return svc ? `/service/${svc.path}` : '';
  });

  readonly pathSegments = computed<PathSegment[]>(() => {
    const call = this.activeCall();
    if (!call) return [];
    return call.path
      .split('/')
      .filter(Boolean)
      .map((seg) =>
        seg.startsWith(':')
          ? { text: seg, isParam: true, paramName: seg.slice(1) }
          : { text: seg, isParam: false },
      );
  });

  readonly pathParams = computed<IServiceCallParameter[]>(() =>
    (this.activeCall()?.parameters ?? []).filter((p) => p.target === 'path'),
  );

  readonly queryParams = computed<IServiceCallParameter[]>(() =>
    (this.activeCall()?.parameters ?? []).filter((p) => p.target === 'query'),
  );

  readonly hasParams = computed(
    () => this.pathParams().length > 0 || this.queryParams().length > 0,
  );

  readonly hasBody = computed(() => {
    const verb = this.activeCall()?.verb;
    return !!verb && VERBS_WITH_BODY.includes(verb);
  });

  readonly resultsString = computed(() => {
    const r = this.results();
    if (r === null || r === undefined) return '';
    return typeof r === 'string' ? r : JSON.stringify(r, null, 2);
  });

  private buildUrl(): string {
    const call = this.activeCall();
    if (!call) return '';
    let callPath = call.path;
    for (const p of this.pathParams()) {
      callPath = callPath.replace(`:${p.name}`, encodeURIComponent(String(p.value ?? '')));
    }
    const base = `${this.basePath()}/${callPath}`.replace(/\/+/g, '/');
    const qp = this.queryParams();
    if (qp.length === 0) return base;
    const qs = qp
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(String(p.value ?? ''))}`)
      .join('&');
    return `${base}?${qs}`;
  }

  onUpdateDescription(value: string): void {
    this.store.dispatch(EditorActions.updateActiveCall({ changes: { description: value } }));
  }

  onUpdateBody(value: string): void {
    this.store.dispatch(EditorActions.updateActiveCall({ changes: { body: value } }));
  }

  onUpdateParamValue(name: string, value: string): void {
    const call = this.activeCall();
    if (!call) return;
    const updated = call.parameters.map((p) =>
      p.name === name ? { ...p, value } : p,
    );
    this.store.dispatch(EditorActions.updateActiveCall({ changes: { parameters: updated } }));
  }

  onActivateParam(name: string | null): void {
    this.activeParamName.set(name);
  }

  onToggleEditDescription(): void {
    this.editDescription.update((v) => !v);
  }

  onCopyUrl(): void {
    this.clipboard.copy(this.buildUrl());
    this.snackBar.open('URL copied', undefined, { duration: 1500 });
  }

  onCopyCurl(): void {
    const call = this.activeCall();
    if (!call) return;
    const url = this.buildUrl();
    let curl = `curl -X ${call.verb} "${url}"`;
    if (this.hasBody() && call.body) {
      curl += ` -H "Content-Type: application/json" -d '${call.body}'`;
    }
    this.clipboard.copy(curl);
    this.snackBar.open('curl copied', undefined, { duration: 1500 });
  }

  onRunTest(): void {
    const call = this.activeCall();
    if (!call || this.testing()) return;
    const url = this.buildUrl();
    this.testing.set(true);
    this.results.set(null);
    this.isError.set(false);

    const body = this.hasBody() && call.body ? call.body : undefined;

    this.http
      .request(call.verb, url, { body, responseType: 'text' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (text) => {
          this.testing.set(false);
          try {
            this.results.set(JSON.parse(text));
          } catch {
            this.results.set(text);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.testing.set(false);
          let errData: unknown = err.error;
          if (typeof errData === 'string') {
            try {
              errData = JSON.parse(errData);
            } catch {
              // keep as string
            }
          }
          this.results.set(errData ?? { status: err.status, message: err.message });
          this.isError.set(true);
        },
      });
  }
}
