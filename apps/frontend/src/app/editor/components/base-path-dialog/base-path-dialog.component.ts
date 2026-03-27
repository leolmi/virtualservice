import {
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { EditorApiService } from '../../editor-api.service';

export interface BasePathDialogData {
  currentPath: string;
  serviceId: string;
}

/** Caratteri ammessi in un segmento di path URL: alfanumerici, - _ . e / interni */
const PATH_REGEX = /^[a-zA-Z0-9\-_.][a-zA-Z0-9\-_./]*$/;

@Component({
  selector: 'vs-base-path-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './base-path-dialog.component.html',
  styleUrl: './base-path-dialog.component.scss',
})
export class BasePathDialogComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<BasePathDialogComponent>);
  private api = inject(EditorApiService);
  readonly data = inject<BasePathDialogData>(MAT_DIALOG_DATA);

  readonly path = signal(this.data.currentPath);
  readonly checking = signal(false);
  readonly error = signal<'empty' | 'invalid' | 'taken' | 'unavailable' | null>(null);

  readonly canApply = computed(
    () =>
      !this.checking() &&
      this.error() === null &&
      this.path() !== '' &&
      this.path() !== this.data.currentPath,
  );

  private readonly path$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.path$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((p) => {
          if (!p) {
            this.checking.set(false);
            this.error.set('empty');
            return EMPTY;
          }
          if (!PATH_REGEX.test(p)) {
            this.checking.set(false);
            this.error.set('invalid');
            return EMPTY;
          }
          if (p === this.data.currentPath) {
            this.checking.set(false);
            this.error.set(null);
            return EMPTY;
          }
          this.checking.set(true);
          this.error.set(null);
          return this.api.checkPath(p, this.data.serviceId).pipe(
            catchError(() => {
              this.checking.set(false);
              this.error.set('unavailable');
              return EMPTY;
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        this.checking.set(false);
        this.error.set(result.available ? null : 'taken');
      });
  }

  onPathInput(value: string): void {
    const sanitized = value.trim().replace(/^\/+|\/+$/g, '');
    this.path.set(sanitized);
    this.path$.next(sanitized);
  }

  apply(): void {
    if (!this.canApply()) return;
    this.dialogRef.close(this.path());
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
