import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { ApiMessage, VisitRequest, VisitStatus } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class VisitApiService {
  constructor(private readonly http: HttpClient) {}

  getMine(): Observable<VisitRequest[]> {
    return this.http.get<{ requests: VisitRequest[] }>(`${API_BASE}/visit-requests`).pipe(map(({ requests }) => requests));
  }

  requestVisit(roomId: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_BASE}/visit-requests/${roomId}`, {});
  }

  update(id: string, status: Extract<VisitStatus, 'accepted' | 'rejected' | 'cancelled'>): Observable<ApiMessage> {
    return this.http.patch<ApiMessage>(`${API_BASE}/visit-requests/${id}`, { status });
  }
}
