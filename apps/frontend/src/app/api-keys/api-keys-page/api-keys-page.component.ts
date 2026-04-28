import { Component, DestroyRef, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ToolbarService } from '../../core/services/toolbar.service';
import { ToolbarCommand } from '../../core/models/toolbar-command.model';
import {
  selectApiKeys,
  selectApiKeysError,
  selectApiKeysLoading,
  selectLastGeneratedSecret,
} from '../store/api-keys.selectors';
import {
  clearGeneratedSecret,
  generateApiKey,
  generateApiKeyFailure,
  generateApiKeySuccess,
  loadApiKeys,
  revokeApiKey,
  revokeApiKeyFailure,
} from '../store/api-keys.actions';
import { GenerateApiKeyDialogComponent } from '../generate-api-key-dialog/generate-api-key-dialog.component';
import {
  ShowSecretDialogComponent,
  ShowSecretDialogData,
} from '../show-secret-dialog/show-secret-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { MCP_TOOL_GROUPS } from '../mcp-tools-catalog';

@Component({
  selector: 'vs-api-keys-page',
  standalone: true,
  imports: [
    DatePipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './api-keys-page.component.html',
  styleUrl: './api-keys-page.component.scss',
})
export class ApiKeysPageComponent {
  private store = inject(Store);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private toolbar = inject(ToolbarService);

  readonly loading = this.store.selectSignal(selectApiKeysLoading);
  readonly error = this.store.selectSignal(selectApiKeysError);
  readonly keys = this.store.selectSignal(selectApiKeys);
  readonly lastSecret = this.store.selectSignal(selectLastGeneratedSecret);

  readonly displayedColumns = [
    'name',
    'prefix',
    'created',
    'lastUsed',
    'status',
    'actions',
  ];

  readonly toolGroups = MCP_TOOL_GROUPS;

  readonly mcpEndpointUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/mcp`
      : '/mcp';

  /** Snippet di config Claude Desktop pronto da incollare. */
  readonly claudeDesktopConfig =
    `{\n` +
    `  "mcpServers": {\n` +
    `    "virtualservice": {\n` +
    `      "command": "npx",\n` +
    `      "args": [\n` +
    `        "-y",\n` +
    `        "mcp-remote",\n` +
    `        "${this.mcpEndpointUrl}",\n` +
    `        "--header",\n` +
    `        "Authorization: Bearer <YOUR_VSK_KEY>"\n` +
    `      ]\n` +
    `    }\n` +
    `  }\n` +
    `}`;

  constructor() {
    this.store.dispatch(loadApiKeys());

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

    // Quando arriva il segreto in chiaro, apri il dialog
    effect(() => {
      const secret = this.lastSecret();
      if (!secret) return;
      const generated = this.keys()[0];
      if (!generated) return;
      const ref = this.dialog.open(ShowSecretDialogComponent, {
        data: {
          secret,
          keyName: generated.name,
        } satisfies ShowSecretDialogData,
        width: '560px',
        disableClose: true,
      });
      ref.afterClosed().subscribe(() => {
        this.store.dispatch(clearGeneratedSecret());
      });
    });

    this.actions$
      .pipe(ofType(generateApiKeySuccess), takeUntilDestroyed())
      .subscribe(() => {
        this.snackBar.open('API key generated', undefined, { duration: 2500 });
      });

    this.actions$
      .pipe(ofType(generateApiKeyFailure), takeUntilDestroyed())
      .subscribe(({ error }) => {
        this.snackBar.open(error, 'Close', { duration: 5000 });
      });

    this.actions$
      .pipe(ofType(revokeApiKeyFailure), takeUntilDestroyed())
      .subscribe(({ error }) => {
        this.snackBar.open(error, 'Close', { duration: 5000 });
      });
  }

  onGenerate(): void {
    const ref = this.dialog.open(GenerateApiKeyDialogComponent, {
      width: '420px',
    });
    ref.afterClosed().subscribe((name: string | null | undefined) => {
      if (!name) return;
      this.store.dispatch(generateApiKey({ name }));
    });
  }

  onRevoke(id: string, name: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Revoke API key',
          message: `Are you sure you want to revoke "${name}"? Any client using this key will stop working immediately.`,
          confirmLabel: 'Revoke',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.store.dispatch(revokeApiKey({ id }));
      });
  }

  async copyToClipboard(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.snackBar.open(`${label} copied to clipboard`, undefined, {
        duration: 2000,
      });
    } catch {
      this.snackBar.open(`Could not copy ${label}`, 'Close', { duration: 3000 });
    }
  }
}
