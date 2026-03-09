import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

@Component({
  selector: 'vs-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private breakpoints = inject(BreakpointObserver);

  readonly version = inject(APP_VERSION);

  isNarrow = toSignal(
    this.breakpoints
      .observe('(max-width: 800px)')
      .pipe(map((r) => r.matches)),
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
}
