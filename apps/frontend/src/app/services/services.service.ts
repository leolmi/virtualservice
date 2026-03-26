import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IServiceItem } from './store/services.state';

@Injectable({ providedIn: 'root' })
export class ServicesApiService {
  private http = inject(HttpClient);

  getAll(): Observable<IServiceItem[]> {
    return this.http.get<IServiceItem[]>('/services');
  }

  save(service: Partial<IServiceItem>): Observable<IServiceItem> {
    return this.http.post<IServiceItem>('/services', service);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/services/${id}`);
  }
}
