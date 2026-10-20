import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RoomApiService } from '../../core/services/room-api.service';
import { VisitApiService } from '../../core/services/visit-api.service';
import { Room, VisitRequest } from '../../core/models/api.models';
import { RoomCardComponent } from '../../shared/room-card/room-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, RoomCardComponent],
  template: `
    <main class="dashboard-page">
      <header class="page-heading"><div><p class="eyebrow">Student dashboard</p><h1>Your places and plans</h1><p>Keep your saved rooms and visit requests together.</p></div><a class="browse-button" routerLink="/">Browse rooms</a></header>
      <section class="dashboard-section"><div class="section-heading"><div><p class="eyebrow">Your shortlist</p><h2>Saved rooms</h2></div><span>{{ savedRooms.length }} saved</span></div>
        <div class="room-grid" *ngIf="savedRooms.length"><app-room-card *ngFor="let room of savedRooms" [room]="room" [saved]="true" (save)="toggleSaved($event)" /></div>
        <div class="empty" *ngIf="!loading && !savedRooms.length"><p>You have not saved a room yet.</p><a routerLink="/">Explore available rooms</a></div>
      </section>
      <section class="dashboard-section"><div class="section-heading"><div><p class="eyebrow">Plan a visit</p><h2>Visit requests</h2></div><span>{{ requests.length }} total</span></div>
        <div class="request-list" *ngIf="requests.length"><article class="request-row" *ngFor="let request of requests"><div><a [routerLink]="['/rooms', roomId(request)]">{{ roomTitle(request) }}</a><span>{{ request.createdAt | date:'mediumDate' }} &middot; {{ roomLocation(request) }}</span></div><span class="status" [class.pending]="request.status === 'pending'">{{ request.status | titlecase }}</span><button *ngIf="request.status === 'pending'" type="button" (click)="cancel(request)">Cancel request</button></article></div>
        <div class="empty" *ngIf="!loading && !requests.length"><p>No visit requests yet.</p><a routerLink="/">Find a room to visit</a></div>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:65vh; background:var(--paper,#f5f4ec); color:var(--ink,#202a24); }.dashboard-page { max-width:1280px; margin:auto; padding:52px 24px 75px; }.page-heading,.section-heading { display:flex; align-items:end; justify-content:space-between; gap:20px; }.page-heading { margin-bottom:42px; }.eyebrow { color:var(--green,#315d46); font-size:.72rem; font-weight:800; text-transform:uppercase; }.page-heading h1 { margin:8px 0; font:2.8rem Georgia,serif; }.page-heading p:last-child { color:var(--muted,#69756c); font-size:.88rem; }.browse-button { padding:12px 16px; background:var(--green,#315d46); color:white; font-size:.83rem; font-weight:700; text-decoration:none; }.dashboard-section { padding:28px 0 38px; border-top:1px solid var(--line,#dedfd3); }.section-heading h2 { margin:0; font:2rem Georgia,serif; }.section-heading .eyebrow { margin:0 0 7px; }.section-heading>span { color:var(--muted,#69756c); font-size:.83rem; }.room-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; margin-top:22px; }.empty { padding:28px; background:var(--surface,#fffefa); color:var(--muted,#69756c); }.empty a { color:var(--green,#315d46); font-weight:700; }.request-list { margin-top:18px; background:var(--surface,#fffefa); border:1px solid var(--line,#dedfd3); }.request-row { min-height:72px; padding:14px 17px; display:flex; justify-content:space-between; align-items:center; gap:15px; border-bottom:1px solid var(--line,#dedfd3); }.request-row:last-child { border-bottom:0; }.request-row>div { display:grid; gap:5px; }.request-row a { color:var(--ink,#202a24); font-weight:700; text-decoration:none; }.request-row>div>span { color:var(--muted,#69756c); font-size:.77rem; }.status { padding:6px 9px; background:#e5ecdf; color:#315d46; font-size:.72rem; font-weight:800; text-transform:uppercase; }.status.pending { background:#f4e7cd; color:#7b5721; }.request-row button { border:0; background:transparent; color:#8b4634; font-size:.78rem; font-weight:700; cursor:pointer; }
    @media(max-width:850px) { .room-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media(max-width:600px) { .dashboard-page { padding:35px 17px 55px; }.page-heading h1 { font-size:2.2rem; }.page-heading { align-items:start; flex-direction:column; }.room-grid { grid-template-columns:1fr; }.request-row { align-items:start; flex-wrap:wrap; } }
  `]
})
export class StudentDashboardPageComponent implements OnInit {
  savedRooms: Room[] = [];
  requests: VisitRequest[] = [];
  loading = true;

  constructor(private readonly roomsApi: RoomApiService, private readonly visitsApi: VisitApiService, private readonly notifications: NotificationService, readonly auth: AuthService) {}

  ngOnInit(): void {
    this.roomsApi.getFavourites().subscribe({ next: (rooms) => this.savedRooms = rooms, error: () => this.notifications.show('Could not load saved rooms.', true) });
    this.visitsApi.getMine().subscribe({ next: (requests) => { this.requests = requests; this.loading = false; }, error: () => { this.loading = false; this.notifications.show('Could not load visit requests.', true); } });
  }

  toggleSaved(room: Room): void {
    this.roomsApi.toggleFavourite(room._id).subscribe({
      next: ({ message }) => { this.savedRooms = this.savedRooms.filter((saved) => saved._id !== room._id); this.notifications.show(message); },
      error: (error) => this.notifications.show(error.error?.message || 'Could not update saved room.', true),
    });
  }

  cancel(request: VisitRequest): void {
    this.visitsApi.update(request._id, 'cancelled').subscribe({
      next: ({ message }) => { request.status = 'cancelled'; this.notifications.show(message); },
      error: (error) => this.notifications.show(error.error?.message || 'Could not cancel visit.', true),
    });
  }

  roomId(request: VisitRequest): string { return typeof request.room === 'object' && request.room ? request.room._id : ''; }
  roomTitle(request: VisitRequest): string { return typeof request.room === 'object' && request.room ? request.room.title : 'Rental listing'; }
  roomLocation(request: VisitRequest): string { return typeof request.room === 'object' && request.room ? request.room.location : 'Room'; }
}
