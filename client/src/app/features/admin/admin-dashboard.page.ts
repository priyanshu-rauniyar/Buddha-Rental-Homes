import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Room } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { RoomApiService } from '../../core/services/room-api.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="admin-page">
      <header class="page-heading"><div><p class="eyebrow">Administration</p><h1>Listing review</h1><p>Verify room information before it appears in public search.</p></div><span class="count">{{ rooms.length }} pending</span></header>
      <p class="loading" *ngIf="loading">Loading pending listings...</p>
      <section class="queue" *ngIf="!loading && rooms.length">
        <article class="queue-item" *ngFor="let room of rooms">
          <img [src]="room.imageUrls[0] || fallbackImage" [alt]="room.title" />
          <div class="details"><p class="eyebrow">{{ room.city || room.location }} &middot; {{ room.roomType | titlecase }}</p><h2>{{ room.title }}</h2><p>{{ room.description }}</p><div><span>Address: {{ room.address }}</span><span>Rent: &#8377;{{ room.rent | number }}/month</span><span>Deposit: &#8377;{{ room.deposit | number }}</span><span>Host: {{ ownerName(room) }}</span></div></div>
          <div class="actions"><button class="approve" type="button" [disabled]="busyId === room._id" (click)="review(room, 'approved')">Approve</button><button class="reject" type="button" [disabled]="busyId === room._id" (click)="review(room, 'rejected')">Reject</button></div>
        </article>
      </section>
      <section class="empty" *ngIf="!loading && !rooms.length"><span class="check">&#10003;</span><h2>All caught up</h2><p>There are no listings waiting for review.</p></section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:70vh; background:var(--paper,#f5f4ec); color:var(--ink,#202a24); }.admin-page { max-width:1240px; margin:auto; padding:50px 24px 75px; }.page-heading { display:flex; align-items:end; justify-content:space-between; gap:20px; margin-bottom:30px; }.eyebrow { color:var(--green,#315d46); font-size:.72rem; font-weight:800; text-transform:uppercase; }.page-heading h1 { margin:7px 0; font:2.8rem Georgia,serif; }.page-heading p:last-child { color:var(--muted,#69756c); font-size:.87rem; }.count { color:var(--muted,#69756c); font-size:.84rem; }.loading { min-height:180px; display:grid; place-items:center; color:var(--muted,#69756c); }.queue { background:var(--surface,#fffefa); border:1px solid var(--line,#dedfd3); }.queue-item { padding:18px; display:grid; grid-template-columns:170px minmax(0,1fr) auto; align-items:center; gap:20px; border-bottom:1px solid var(--line,#dedfd3); }.queue-item:last-child { border-bottom:0; }.queue-item>img { width:170px; height:130px; object-fit:cover; }.details .eyebrow { margin:0 0 8px; }.details h2 { margin:0 0 8px; font:1.5rem Georgia,serif; }.details p:not(.eyebrow) { margin:0 0 10px; color:#59645b; font-size:.83rem; line-height:1.5; }.details>div { display:flex; flex-wrap:wrap; gap:7px 14px; color:var(--muted,#69756c); font-size:.74rem; }.actions { display:grid; gap:8px; }.actions button { min-height:38px; min-width:90px; border:0; font-size:.77rem; font-weight:800; cursor:pointer; }.actions button:disabled { opacity:.5; cursor:wait; }.approve { background:var(--green,#315d46); color:white; }.reject { background:#f2e5df; color:#8b4634; }.empty { padding:60px 20px; text-align:center; background:var(--surface,#fffefa); }.check { width:42px; height:42px; margin:auto; display:grid; place-items:center; background:#e4eddf; color:var(--green,#315d46); }.empty h2 { font:1.65rem Georgia,serif; }.empty p { color:var(--muted,#69756c); font-size:.86rem; }
    @media(max-width:800px) { .queue-item { grid-template-columns:120px minmax(0,1fr); }.queue-item>img { width:120px; height:110px; }.actions { grid-column:2; display:flex; } }
    @media(max-width:560px) { .admin-page { padding:35px 16px 55px; }.page-heading h1 { font-size:2.2rem; }.queue-item { grid-template-columns:1fr; }.queue-item>img { width:100%; height:195px; }.actions { grid-column:auto; } }
  `]
})
export class AdminDashboardPageComponent implements OnInit {
  rooms: Room[] = [];
  loading = true;
  busyId: string | null = null;
  readonly fallbackImage = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80';

  constructor(private readonly roomsApi: RoomApiService, private readonly notifications: NotificationService, readonly auth: AuthService) {}

  ngOnInit(): void { this.load(); }

  review(room: Room, status: 'approved' | 'rejected'): void {
    this.busyId = room._id;
    this.roomsApi.reviewListing(room._id, status).subscribe({
      next: ({ message }) => { this.notifications.show(message); this.load(); },
      error: (error) => { this.busyId = null; this.notifications.show(error.error?.message || 'Listing review failed.', true); },
    });
  }

  ownerName(room: Room): string { return typeof room.owner === 'object' && room.owner ? room.owner.name : 'Room owner'; }

  private load(): void {
    this.loading = true;
    this.roomsApi.getPendingRooms().subscribe({
      next: (rooms) => { this.rooms = rooms; this.loading = false; this.busyId = null; },
      error: () => { this.loading = false; this.busyId = null; this.notifications.show('Could not load the moderation queue.', true); },
    });
  }
}
