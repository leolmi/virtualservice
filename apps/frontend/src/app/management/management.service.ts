import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MOCK_USERS } from './management.mock';

export interface UserService {
  _id: string;
  name: string;
  path: string;
  active: boolean;
  starred: boolean;
}

export interface ManagedUser {
  _id: string;
  email: string;
  googleId?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isMigrated?: boolean;
  deletionRequestedAt?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  services: UserService[];
  serviceCount: number;
}

@Injectable({ providedIn: 'root' })
export class ManagementService {
  private http = inject(HttpClient);

  getUsers(): Observable<ManagedUser[]> {
    // return of(MOCK_USERS);
    return this.http.get<ManagedUser[]>('/users');
  }

  backup(): Observable<Blob> {
    return this.http.get('/users/backup', { responseType: 'blob' });
  }

  getService(serviceId: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/services/${serviceId}`);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`/users/${userId}`);
  }

  restoreUser(userId: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`/users/${userId}/restore`, {});
  }

  sendMail(
    subject: string,
    body: string,
    userIds?: string[],
  ): Observable<{ sent: number; failed: number }> {
    return this.http.post<{ sent: number; failed: number }>(
      '/users/send-mail',
      {
        subject,
        body,
        userIds: userIds?.length ? userIds : undefined,
      },
    );
  }
}
