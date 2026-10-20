import { Injectable, signal } from '@angular/core';

export interface Notice {
  message: string;
  error: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notice = signal<Notice | null>(null);

  show(message: string, error = false): void {
    this.notice.set({ message, error });
  }

  clear(): void {
    this.notice.set(null);
  }
}
