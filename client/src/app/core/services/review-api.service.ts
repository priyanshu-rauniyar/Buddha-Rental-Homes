import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { ApiMessage, Review, ReviewListResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ReviewApiService {
  constructor(private readonly http: HttpClient) {}

  getForRoom(roomId: string): Observable<ReviewListResponse> {
    return this.http.get<ReviewListResponse>(`${API_BASE}/rooms/${roomId}/reviews`);
  }

  create(roomId: string, input: { rating: number; comment: string }): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_BASE}/rooms/${roomId}/reviews`, input);
  }

  delete(roomId: string, reviewId: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${API_BASE}/rooms/${roomId}/reviews/${reviewId}`);
  }
}
