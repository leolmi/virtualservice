import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IUser } from '@virtualservice/shared/model';
import { Observable, switchMap } from 'rxjs';

const TOKEN_KEY = 'vs_token';
const USER_KEY = 'vs_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  login(
    email: string,
    password: string,
  ): Observable<{ token: string; user: IUser }> {
    return this.http
      .post<{ accessToken: string }>('/auth/login', { email, password })
      .pipe(
        switchMap(({ accessToken }) =>
          this.http
            .get<IUser>('/auth/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            .pipe(
              switchMap((user) => [{ token: accessToken, user }] as const),
            ),
        ),
      );
  }

  getMe(token: string): Observable<IUser> {
    return this.http.get<IUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  saveSession(token: string, user: IUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  restoreSession(): { token: string; user: IUser } | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (token && userJson) {
      try {
        return { token, user: JSON.parse(userJson) as IUser };
      } catch {
        this.clearSession();
        return null;
      }
    }
    return null;
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
