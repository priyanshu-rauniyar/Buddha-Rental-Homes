import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { API_BASE } from '../api-base';
import { ApiMessage, LoginResponse, User, UserRole } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'buddha-rental-token';
  private restoreRequest?: Observable<User | null>;
  readonly user = signal<User | null>(null);

  constructor(private readonly http: HttpClient) {}

  register(input: { name: string; email: string; password: string; role: 'student' | 'owner' }): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${API_BASE}/auth/register`, input);
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<LoginResponse>(`${API_BASE}/auth/login`, credentials).pipe(
      tap(({ token, user }) => {
        localStorage.setItem(this.tokenKey, token);
        this.user.set(user);
      }),
      map(({ user }) => user)
    );
  }

  restoreSession(): Observable<User | null> {
    if (this.user()) return of(this.user());
    if (!localStorage.getItem(this.tokenKey)) return of(null);
    if (this.restoreRequest) return this.restoreRequest;
    this.restoreRequest = this.http.get<{ user: User }>(`${API_BASE}/auth/me`).pipe(
      map(({ user }) => user),
      tap((user) => this.user.set(user)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
      finalize(() => this.restoreRequest = undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.restoreRequest;
  }

  logout(): void {
    this.restoreRequest = undefined;
    localStorage.removeItem(this.tokenKey);
    this.user.set(null);
  }

  hasRole(role: UserRole): boolean {
    return this.user()?.role === role;
  }
}
