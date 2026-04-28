import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectUser } from '../../../auth/store/auth.selectors';
import { logout } from '../../../auth/store/auth.actions';
import { AuthService } from '../../../auth/auth.service';
import { ToolbarService } from '../../services/toolbar.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';
import {
  ChangePasswordDialogComponent,
  ChangePasswordDialogData,
} from '../change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'vs-toolbar',
  standalone: true,
  imports: [
    NgClass,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private breakpoints = inject(BreakpointObserver);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private toolbarService = inject(ToolbarService);

  private isNarrowBreakpoint = toSignal(
    this.breakpoints.observe('(max-width: 800px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  isNarrow = computed(
    () => this.toolbarService.forceLow() || this.isNarrowBreakpoint(),
  );

  isForceLow = computed(() => this.toolbarService.forceLow());

  /** True only when the viewport is physically narrow — drives command display mode */
  isSmallScreen = computed(() => this.isNarrowBreakpoint());

  user = this.store.selectSignal(selectUser);

  isAdmin = computed(() => this.user()?.role === 'admin');

  commands = this.toolbarService.commands;

  visibleCommands = computed(() =>
    this.commands().filter((c) => c.visible !== false),
  );

  buttonCommands = computed(() =>
    this.visibleCommands().filter((c) => c.type !== 'separator'),
  );

  // ─── User menu actions ──────────────────────────────────────────────────────

  onAdminArea(): void {
    this.router.navigate(['/management']);
  }

  onHelp(): void {
    this.router.navigate(['/help'], {
      fragment: this.toolbarService.helpContext(),
    });
  }

  onApiKeys(): void {
    this.router.navigate(['/api-keys']);
  }

  onChangePassword(): void {
    const user = this.user();
    this.dialog.open(ChangePasswordDialogComponent, {
      data: {
        hasPassword: !!user?.password,
      } satisfies ChangePasswordDialogData,
    });
  }

  onDeleteAccount(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete account',
          message:
            'Are you sure you want to request account deletion? Your account will be suspended and all access blocked until an administrator processes the request.',
          confirmLabel: 'Request deletion',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.authService.requestDeletion().subscribe({
          next: () => this.store.dispatch(logout()),
        });
      });
  }

  onLogout(): void {
    this.store.dispatch(logout());
  }
}
