import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ToolbarService } from '../../core/services/toolbar.service';
import { ToolbarCommand } from '../../core/models/toolbar-command.model';
import {
  selectTemplates,
  selectTemplatesError,
  selectTemplatesLoading,
} from '../store/templates.selectors';
import {
  deleteTemplate,
  installTemplate,
  installTemplateFailure,
  installTemplateSuccess,
  loadTemplates,
} from '../store/templates.actions';
import { TemplateTileComponent } from '../template-tile/template-tile.component';
import {
  TemplatePreviewDialogComponent,
  TemplatePreviewDialogData,
} from '../template-preview-dialog/template-preview-dialog.component';
import {
  TemplateInstallDialogComponent,
  TemplateInstallDialogData,
  TemplateInstallDialogResult,
} from '../template-install-dialog/template-install-dialog.component';
import { ITemplateItem } from '../store/templates.state';

@Component({
  selector: 'vs-templates-page',
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    TemplateTileComponent,
  ],
  templateUrl: './templates-page.component.html',
  styleUrl: './templates-page.component.scss',
})
export class TemplatesPageComponent {
  private store = inject(Store);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private toolbar = inject(ToolbarService);

  readonly loading = this.store.selectSignal(selectTemplatesLoading);
  readonly error = this.store.selectSignal(selectTemplatesError);
  readonly templates = this.store.selectSignal(selectTemplates);

  constructor() {
    this.store.dispatch(loadTemplates());

    const commands: ToolbarCommand[] = [
      {
        id: 'services',
        icon: 'view_module',
        tooltip: 'My services',
        action: () => this.router.navigate(['/services']),
      },
    ];
    this.toolbar.set(commands);

    inject(DestroyRef).onDestroy(() => this.toolbar.clear());

    // Feedback su install (success → snackbar; effect già naviga all'editor)
    this.actions$
      .pipe(ofType(installTemplateSuccess), takeUntilDestroyed())
      .subscribe(({ service }) => {
        this.snackBar.open(
          `Template installed as "${service.name}"`,
          undefined,
          { duration: 3000 },
        );
      });

    this.actions$
      .pipe(ofType(installTemplateFailure), takeUntilDestroyed())
      .subscribe(({ error }) => {
        this.snackBar.open(error, 'Close', { duration: 5000 });
      });
  }

  /** Click sulla card o sull'icona occhio → apre la preview con bottone Install */
  onPreview(id: string): void {
    const tpl = this.templates().find((t) => t._id === id);
    if (!tpl) return;
    const ref = this.dialog.open(TemplatePreviewDialogComponent, {
      data: { template: tpl, canInstall: true } satisfies TemplatePreviewDialogData,
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe((shouldInstall: boolean | undefined) => {
      if (shouldInstall) this.openInstallDialog(tpl);
    });
  }

  /** Bottone INSTALL diretto nella tile → salta la preview, apre subito il dialog di install */
  onInstall(id: string): void {
    const tpl = this.templates().find((t) => t._id === id);
    if (!tpl) return;
    this.openInstallDialog(tpl);
  }

  onDelete(id: string): void {
    this.store.dispatch(deleteTemplate({ id }));
  }

  private openInstallDialog(tpl: ITemplateItem): void {
    const ref = this.dialog.open(TemplateInstallDialogComponent, {
      data: {
        templateTitle: tpl.title,
      } satisfies TemplateInstallDialogData,
      width: '480px',
    });
    ref.afterClosed().subscribe((result: TemplateInstallDialogResult | null) => {
      if (!result) return;
      this.store.dispatch(
        installTemplate({
          id: tpl._id,
          dto: { path: result.path, name: result.name },
        }),
      );
    });
  }
}
