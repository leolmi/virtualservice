import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpVerb } from '@virtualservice/shared/model';

export interface DiscoverCall {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  servicePath: string;
  ownerId: string;
  ownerAvatarUrl?: string;
  verb: HttpVerb;
  callPath: string;
  callDescription: string;
}

@Injectable({ providedIn: 'root' })
export class DiscoverApiService {
  private http = inject(HttpClient);

  getAll(): Observable<DiscoverCall[]> {
    return this.http.get<DiscoverCall[]>('/discover');
  }
}
