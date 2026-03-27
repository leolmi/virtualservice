import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { login, loginWithGoogle } from '../store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../store/auth.selectors';
import { APP_VERSION } from '../../core/tokens/app.tokens';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'vs-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ClipboardModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private clipboard = inject(Clipboard);
  private snack = inject(MatSnackBar);
  private breakpoints = inject(BreakpointObserver);

  readonly version = inject(APP_VERSION);

  isNarrow = toSignal(
    this.breakpoints.observe('(max-width: 800px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  loading = this.store.selectSignal(selectAuthLoading);
  error = this.store.selectSignal(selectAuthError);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.valid) {
      const { email, password } = this.form.getRawValue();
      this.store.dispatch(login({ email, password }));
    }
  }

  onGoogleLogin(): void {
    this.store.dispatch(loginWithGoogle());
  }

  goToHelp(): void {
    this.router.navigate(['/help']);
  }

  goToLocal(): void {

  }

  copyText(txt: string): void {
    this.clipboard.copy(txt);
    this.snack.open('Text copied successfully', 'ok', { duration: 3000 });
  }
}
