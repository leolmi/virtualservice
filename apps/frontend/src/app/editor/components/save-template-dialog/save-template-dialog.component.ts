import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { CreateTemplateDto } from '@virtualservice/shared/dto';
import { IServiceCall } from '@virtualservice/shared/model';
import { IServiceItem } from '../../../services/store/services.state';

export interface SaveTemplateDialogData {
  service: IServiceItem;
}

@Component({
  selector: 'vs-save-template-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatChipsModule,
  ],
  templateUrl: './save-template-dialog.component.html',
  styleUrl: './save-template-dialog.component.scss',
})
export class SaveTemplateDialogComponent {
  private dialogRef = inject(
    MatDialogRef<SaveTemplateDialogComponent, CreateTemplateDto | null>,
  );
  readonly data = inject<SaveTemplateDialogData>(MAT_DIALOG_DATA);

  readonly title = signal('');
  readonly description = signal('');
  readonly tags = signal<string[]>([]);

  readonly hasDb = !!this.data.service.dbo;
  readonly hasScheduler = !!this.data.service.schedulerFn;

  readonly includeDb = signal(this.hasDb);
  readonly includeScheduler = signal(this.hasScheduler);

  /** Indici delle call selezionate (di default tutte) */
  readonly selectedCalls = signal<Set<number>>(
    new Set(this.data.service.calls.map((_, i) => i)),
  );

  readonly canApply = computed(() => {
    const t = this.title().trim();
    const d = this.description().trim();
    return (
      t.length >= 3 &&
      t.length <= 120 &&
      d.length > 0 &&
      d.length <= 2000 &&
      this.selectedCalls().size > 0
    );
  });

  readonly allCallsSelected = computed(
    () => this.selectedCalls().size === this.data.service.calls.length,
  );

  readonly someCallsSelected = computed(() => {
    const n = this.selectedCalls().size;
    return n > 0 && n < this.data.service.calls.length;
  });

  toggleCall(index: number, checked: boolean): void {
    const next = new Set(this.selectedCalls());
    if (checked) {
      next.add(index);
    } else {
      next.delete(index);
    }
    this.selectedCalls.set(next);
  }

  toggleAllCalls(checked: boolean): void {
    if (checked) {
      this.selectedCalls.set(
        new Set(this.data.service.calls.map((_, i) => i)),
      );
    } else {
      this.selectedCalls.set(new Set());
    }
  }

  isCallSelected(index: number): boolean {
    return this.selectedCalls().has(index);
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value ?? '').trim();
    if (value && !this.tags().includes(value)) {
      this.tags.set([...this.tags(), value]);
    }
    event.chipInput?.clear();
  }

  removeTag(tag: string): void {
    this.tags.set(this.tags().filter((t) => t !== tag));
  }

  apply(): void {
    if (!this.canApply()) return;
    const indices = Array.from(this.selectedCalls()).sort((a, b) => a - b);
    const calls: IServiceCall[] = indices.map(
      (i) => this.data.service.calls[i],
    );

    const dto: CreateTemplateDto = {
      title: this.title().trim(),
      description: this.description().trim(),
      tags: this.tags(),
      calls,
    };
    if (this.includeDb() && this.hasDb) {
      dto.dbo = this.data.service.dbo;
    }
    if (this.includeScheduler() && this.hasScheduler) {
      dto.schedulerFn = this.data.service.schedulerFn;
      dto.interval = this.data.service.interval;
    }
    this.dialogRef.close(dto);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
