import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILog } from '@virtualservice/shared/model';

/** ILog as returned by MongoDB — always includes _id */
export type ILogItem = ILog & { _id: string };

/** Typed subset of the serialised Express request stored in log */
export interface LogRequest {
  method?: string;
  path?: string;
  query?: Record<string, unknown>;
  ip?: string;
  ips?: string[];
  headers?: Record<string, unknown>;
  body?: unknown;
}

@Injectable({ providedIn: 'root' })
export class MonitorApiService {
  private http = inject(HttpClient);

  /**
   * Fetch log entries for a service.
   * @param serviceId  Target service ID
   * @param last       If provided, returns only entries with time >= last
   */
  getLogs(serviceId: string, last?: number): Observable<ILogItem[]> {
    const url =
      last !== undefined
        ? `/api/services/monitor/${serviceId}/${last}`
        : `/api/services/monitor/${serviceId}`;
    return this.http.get<ILogItem[]>(url);
  }

  /** Deletes all log entries for the authenticated user */
  clearLogs(): Observable<void> {
    return this.http.delete<void>('/api/services');
  }

  /** Resets the in-memory database cache of the given service */
  restartService(serviceId: string): Observable<void> {
    return this.http.post<void>('/api/services/restart', { _id: serviceId });
  }
}
