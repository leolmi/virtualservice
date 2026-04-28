import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IApiKeyPublic,
  IGeneratedApiKey,
} from '@virtualservice/shared/model';
import { GenerateApiKeyDto } from '@virtualservice/shared/dto';

@Injectable({ providedIn: 'root' })
export class ApiKeysApiService {
  private http = inject(HttpClient);

  list(): Observable<IApiKeyPublic[]> {
    return this.http.get<IApiKeyPublic[]>('/api-keys');
  }

  generate(dto: GenerateApiKeyDto): Observable<IGeneratedApiKey> {
    return this.http.post<IGeneratedApiKey>('/api-keys', dto);
  }

  revoke(id: string): Observable<void> {
    return this.http.delete<void>(`/api-keys/${id}`);
  }
}
