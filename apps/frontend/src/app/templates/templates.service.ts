import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTemplateDto,
  InstallTemplateDto,
} from '@virtualservice/shared/dto';
import { ITemplateItem } from './store/templates.state';
import { IServiceItem } from '../services/store/services.state';

@Injectable({ providedIn: 'root' })
export class TemplatesApiService {
  private http = inject(HttpClient);

  getAll(): Observable<ITemplateItem[]> {
    return this.http.get<ITemplateItem[]>('/templates');
  }

  getOne(id: string): Observable<ITemplateItem> {
    return this.http.get<ITemplateItem>(`/templates/${id}`);
  }

  create(dto: CreateTemplateDto): Observable<ITemplateItem> {
    return this.http.post<ITemplateItem>('/templates', dto);
  }

  install(id: string, dto: InstallTemplateDto): Observable<IServiceItem> {
    return this.http.post<IServiceItem>(`/templates/${id}/install`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/templates/${id}`);
  }
}
