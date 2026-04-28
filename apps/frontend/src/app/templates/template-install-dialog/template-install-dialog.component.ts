import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  Subject,
  switchMap,
  takeUntil,
  catchError,
} from 'rxjs';
import { EditorApiService } from '../../editor/editor-api.service';

export interface TemplateInstallDialogData {
  templateTitle: string;
  /** Path suggerito di default (es. slug del titolo) */
  suggestedPath?: string;
}

export interface TemplateInstallDialogResult {
  name: string;
  path: string;
}

const PATH_REGEX = /^[a-zA-Z0-9\-_.][a-zA-Z0-9\-_./]*$/;

@Component({
  selector: 'vs-template-install-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './template-install-dialog.component.html',
  styleUrl: './template-install-dialog.component.scss',
})
export class TemplateInstallDialogComponent implements OnDestroy {
  private dialogRef = inject(
    MatDialogRef<TemplateInstallDialogComponent, TemplateInstallDialogResult | null>,
  );
  private api = inject(EditorApiService);
  readonly data = inject<TemplateInstallDialogData>(MAT_DIALOG_DATA);

  readonly name = signal(this.data.templateTitle);
  readonly path = signal(this.data.suggestedPath ?? this.slugify(this.data.templateTitle));
  readonly checking = signal(false);
  readonly pathError = signal<'empty' | 'invalid' | 'taken' | 'unavailable' | null>(null);

  readonly canApply = computed(
    () =>
      !this.checking() &&
      this.pathError() === null &&
      this.path().trim() !== '' &&
      this.name().trim() !== '',
  );

  private readonly path$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Validazione iniziale del path suggerito
    queueMicrotask(() => this.path$.next(this.path()));

    this.path$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((p) => {
          if (!p) {
            this.checking.set(false);
            this.pathError.set('empty');
            return EMPTY;
          }
          if (!PATH_REGEX.test(p)) {
            this.checking.set(false);
            this.pathError.set('invalid');
            return EMPTY;
          }
          this.checking.set(true);
          this.pathError.set(null);
          // Nessun servizio da escludere — passiamo stringa vuota
          return this.api.checkPath(p, '').pipe(
            catchError(() => {
              this.checking.set(false);
              this.pathError.set('unavailable');
              return EMPTY;
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        this.checking.set(false);
        this.pathError.set(result.available ? null : 'taken');
      });
  }

  onPathInput(value: string): void {
    const sanitized = value.trim().replace(/^\/+|\/+$/g, '');
    this.path.set(sanitized);
    this.path$.next(sanitized);
  }

  onNameInput(value: string): void {
    this.name.set(value);
  }

  apply(): void {
    if (!this.canApply()) return;
    this.dialogRef.close({
      name: this.name().trim(),
      path: this.path(),
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private slugify(s: string): string {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}
