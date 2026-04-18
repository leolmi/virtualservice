import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthService } from '../auth.service';
import { loginSuccess } from '../store/auth.actions';

@Component({
  selector: 'vs-google-callback',
  standalone: true,
  template: '',
})
export class GoogleCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getMe(token).subscribe({
      next: (user) => {
        this.authService.saveSession(token, user);
        this.store.dispatch(loginSuccess({ token, user }));
        this.router.navigate(['/services']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
