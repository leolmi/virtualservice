import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    return this.http.get<ManagedUser[]>('/users');
  }

  backup(): Observable<Blob> {
    return this.http.get('/users/backup', { responseType: 'blob' });
  }
}
