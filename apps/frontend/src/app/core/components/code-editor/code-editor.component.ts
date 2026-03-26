import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';

/**
 * Lightweight CodeMirror 6 wrapper.
 *
 * Features: JavaScript syntax highlighting, light theme, line numbers,
 * bracket matching, code folding, search (Ctrl+F), Tab key indentation.
 *
 * Binding:
 *   <vs-code-editor [value]="code" (valueChange)="code = $event" />
 */
@Component({
  selector: 'vs-code-editor',
  standalone: true,
  template: `<div #host class="cm-host"></div>`,
  // ViewEncapsulation.None so that CodeMirror's internal DOM receives our styles
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      vs-code-editor {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        overflow: hidden;
      }
      vs-code-editor .cm-host {
        height: 100%;
        overflow: hidden;
      }
      vs-code-editor .cm-editor {
        height: 100%;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        line-height: 1.55;
      }
      vs-code-editor .cm-scroller {
        overflow: auto;
      }
    `,
  ],
})
export class CodeEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host') private hostRef!: ElementRef<HTMLDivElement>;

  /** Current code content */
  @Input() value = '';

  /** Emits the full document text on every change */
  @Output() valueChange = new EventEmitter<string>();

  private view: EditorView | null = null;
  private zone = inject(NgZone);

  ngAfterViewInit(): void {
    // Run outside Angular zone to avoid excessive change detection
    this.zone.runOutsideAngular(() => {
      this.view = new EditorView({
        state: EditorState.create({
          doc: this.value,
          extensions: [
            basicSetup,
            javascript(),
            keymap.of([indentWithTab]),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                const text = update.state.doc.toString();
                // Re-enter Angular zone so data-binding and store dispatch work
                this.zone.run(() => this.valueChange.emit(text));
              }
            }),
          ],
        }),
        parent: this.hostRef.nativeElement,
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value'] || !this.view) return;
    const incoming = (changes['value'].currentValue as string) ?? '';
    // Avoid feedback loop: skip if editor already has the same content
    if (incoming === this.view.state.doc.toString()) return;
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: incoming },
    });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
    this.view = null;
  }
}
