import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IServiceItem } from '../services/store/services.state';

@Injectable({ providedIn: 'root' })
export class EditorApiService {
  private http = inject(HttpClient);

  getById(id: string): Observable<IServiceItem> {
    return this.http.get<IServiceItem>(`/services/${id}`);
  }

  save(service: IServiceItem): Observable<IServiceItem> {
    return this.http.post<IServiceItem>('/services', service);
  }

  checkPath(path: string, serviceId: string): Observable<{ available: boolean }> {
    const params = new HttpParams().set('path', path).set('serviceId', serviceId);
    return this.http.get<{ available: boolean }>('/services/check-path', { params });
  }
}
