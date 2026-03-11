import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IServiceItem } from '../services/store/services.state';

@Injectable({ providedIn: 'root' })
export class EditorApiService {
  private http = inject(HttpClient);

  getById(id: string): Observable<IServiceItem> {
    return this.http.get<IServiceItem>(`/api/services/${id}`);
  }

  save(service: IServiceItem): Observable<IServiceItem> {
    return this.http.post<IServiceItem>('/api/services', service);
  }
}
