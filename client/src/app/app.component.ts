import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    readonly auth: AuthService,
    readonly notifications: NotificationService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.auth.restoreSession().subscribe();
  }

  get dashboardPath(): string {
    return `/${this.auth.user()?.role || 'student'}`;
  }

  logout(): void {
    this.auth.logout();
    this.notifications.show('You have signed out.');
    void this.router.navigateByUrl('/login');
  }
}
