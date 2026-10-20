import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../api-base';
import { ApiMessage, PageResponse, Room, RoomAvailability, RoomInput, RoomSearch } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RoomApiService {
  constructor(private readonly http: HttpClient) {}

  search(filters: RoomSearch = {}): Observable<PageResponse<Room>> {
    let params = new HttpParams();
    for (const key of ['location', 'roomType', 'availability', 'page', 'limit', 'minRent', 'maxRent'] as const) {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params = params.set(key, value);
      }
    }
    return this.http.get<PageResponse<Room>>(`${API_BASE}/rooms`, { params });
  }

  getById(id: string): Observable<Room> {
    return this.http.get<{ room: Room }>(`${API_BASE}/rooms/${id}`).pipe(map(({ room }) => room));
  }

  getOwnerRooms(): Observable<Room[]> {
    return this.http.get<{ rooms: Room[] }>(`${API_BASE}/owner/rooms`).pipe(map(({ rooms }) => rooms));
  }

  getPendingRooms(): Observable<Room[]> {
    return this.http.get<{ rooms: Room[] }>(`${API_BASE}/admin/rooms/pending`).pipe(map(({ rooms }) => rooms));
  }

  create(input: RoomInput): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_BASE}/rooms`, input);
  }

  update(id: string, input: RoomInput): Observable<ApiMessage> {
    return this.http.patch<ApiMessage>(`${API_BASE}/rooms/${id}`, input);
  }

  updateAvailability(id: string, availability: RoomAvailability): Observable<ApiMessage> {
    return this.http.patch<ApiMessage>(`${API_BASE}/rooms/${id}/availability`, { availability });
  }

  deactivate(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${API_BASE}/rooms/${id}`);
  }

  reviewListing(id: string, status: 'approved' | 'rejected'): Observable<ApiMessage> {
    return this.http.patch<ApiMessage>(`${API_BASE}/admin/rooms/${id}/review`, { status });
  }

  getFavourites(): Observable<Room[]> {
    return this.http.get<{ favourites: Array<{ room: Room | string }> }>(`${API_BASE}/favourites`).pipe(
      map(({ favourites }) => favourites.flatMap(({ room }) => typeof room === 'string' ? [] : [room]))
    );
  }

  toggleFavourite(id: string): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_BASE}/favourites/${id}`, {});
  }
}
