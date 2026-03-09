import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUser } from '@virtualservice/shared/model';
import { Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  login(
    email: string,
    password: string,
  ): Observable<{ token: string; user: IUser }> {
    return this.http
      .post<{ accessToken: string }>('/api/auth/login', { email, password })
      .pipe(
        switchMap(({ accessToken }) =>
          this.http
            .get<IUser>('/api/auth/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            .pipe(
              switchMap((user) => [{ token: accessToken, user }] as const),
            ),
        ),
      );
  }
}
