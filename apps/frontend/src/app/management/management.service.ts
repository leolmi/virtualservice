import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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

// ─── MOCK TEMPORANEO — rimuovere dopo il test visivo ─────────────────────────
function _mockServices(userId: string, count: number): UserService[] {
  const names = ['Auth API', 'Product Catalog', 'Order Manager', 'Shipping Tracker',
    'Inventory', 'Notification Hub', 'Payment Gateway', 'User Profile',
    'Analytics Feed', 'CMS Content', 'Search Engine', 'Report Builder',
    'File Storage', 'Email Sender', 'Webhook Relay', 'Rate Limiter',
    'Session Store', 'Cache Proxy', 'Geo Locator', 'Currency Converter'];
  return Array.from({ length: count }, (_, i) => ({
    _id: `${userId}-svc-${i}`,
    name: names[i % names.length],
    path: names[i % names.length].toLowerCase().replace(/\s+/g, '-'),
    active: Math.random() > 0.3,
    starred: Math.random() > 0.7,
  }));
}

const _MOCK_USERS: ManagedUser[] = [
  { _id: 'u1',  email: 'alice.martin@example.com',    googleId: 'g-alice',  avatarUrl: 'https://i.pravatar.cc/36?u=u1',  isEmailVerified: true,  role: 'user', createdAt: '2025-01-10T08:00:00Z', updatedAt: '2025-03-01T10:00:00Z', services: _mockServices('u1',  12), serviceCount: 12 },
  { _id: 'u2',  email: 'bob.rossi@company.it',                               isEmailVerified: true,  role: 'user', createdAt: '2025-02-14T09:30:00Z', updatedAt: '2025-03-10T11:00:00Z', services: _mockServices('u2',   7), serviceCount: 7  },
  { _id: 'u3',  email: 'carol.smith@gmail.com',        googleId: 'g-carol', avatarUrl: 'https://i.pravatar.cc/36?u=u3',  isEmailVerified: true,  role: 'user', createdAt: '2025-03-01T14:00:00Z', updatedAt: '2025-03-20T08:00:00Z', services: _mockServices('u3',  19), serviceCount: 19 },
  { _id: 'u4',  email: 'david.nguyen@startup.io',                            isEmailVerified: false, role: 'user', createdAt: '2025-03-15T16:00:00Z', updatedAt: '2025-03-15T16:00:00Z', services: _mockServices('u4',   5), serviceCount: 5  },
  { _id: 'u5',  email: 'elena.bianchi@studio.eu',      googleId: 'g-elena', avatarUrl: 'https://i.pravatar.cc/36?u=u5',  isEmailVerified: true,  role: 'user', createdAt: '2024-11-20T10:00:00Z', updatedAt: '2025-02-28T09:00:00Z', services: _mockServices('u5',   9), serviceCount: 9  },
  { _id: 'u6',  email: 'frank.mueller@enterprise.de',                        isEmailVerified: true,  role: 'user', createdAt: '2024-10-05T07:00:00Z', updatedAt: '2025-01-15T12:00:00Z', services: _mockServices('u6',  15), serviceCount: 15, deletionRequestedAt: '2025-03-25T08:00:00Z' },
  { _id: 'u7',  email: 'grace.lee@techlab.co',         googleId: 'g-grace', avatarUrl: 'https://i.pravatar.cc/36?u=u7',  isEmailVerified: true,  role: 'user', createdAt: '2025-01-28T11:00:00Z', updatedAt: '2025-03-18T15:00:00Z', services: _mockServices('u7',  20), serviceCount: 20 },
  { _id: 'u8',  email: 'henry.dupont@agence.fr',                             isEmailVerified: false, role: 'user', createdAt: '2025-03-22T13:00:00Z', updatedAt: '2025-03-22T13:00:00Z', services: _mockServices('u8',   6), serviceCount: 6  },
  { _id: 'u9',  email: 'isabella.greco@freelance.it',  googleId: 'g-isa',   avatarUrl: 'https://i.pravatar.cc/36?u=u9',  isEmailVerified: true,  role: 'user', createdAt: '2024-12-01T09:00:00Z', updatedAt: '2025-02-10T14:00:00Z', services: _mockServices('u9',  11), serviceCount: 11 },
  { _id: 'u10', email: 'james.wilson@devshop.uk',                            isEmailVerified: true,  role: 'user', createdAt: '2025-02-05T08:00:00Z', updatedAt: '2025-03-05T10:00:00Z', services: _mockServices('u10',  8), serviceCount: 8  },
];
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ManagementService {
  private http = inject(HttpClient);

  getUsers(): Observable<ManagedUser[]> {
    return of(_MOCK_USERS); // TODO: rimuovere il mock — return this.http.get<ManagedUser[]>('/users');
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
}
