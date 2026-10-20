import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Room, RoomInput, RoomType, VisitRequest } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { RoomApiService } from '../../core/services/room-api.service';
import { VisitApiService } from '../../core/services/visit-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="owner-page">
      <header class="page-heading"><div><p class="eyebrow">Host workspace</p><h1>Your room listings</h1><p>Publish a room, keep details current, and manage visit requests.</p></div><span class="total">{{ rooms.length }} listings</span></header>
      <div class="owner-layout">
        <form class="listing-form" (ngSubmit)="saveRoom()"><h2>{{ editingId ? 'Edit listing' : 'Add a room' }}</h2>
          <label>Listing title<input name="title" [(ngModel)]="form.title" required minlength="3" /></label>
          <label>Description<textarea name="description" [(ngModel)]="form.description" required minlength="10" rows="4"></textarea></label>
          <div class="form-row"><label>City<input name="city" [(ngModel)]="form.city" required /></label><label>Locality<input name="location" [(ngModel)]="form.location" required /></label></div>
          <label>Full address<input name="address" [(ngModel)]="form.address" required minlength="3" /></label>
          <div class="form-row"><label>Monthly rent<input name="rent" type="number" min="0" [(ngModel)]="form.rent" required /></label><label>Deposit<input name="deposit" type="number" min="0" [(ngModel)]="form.deposit" /></label></div>
          <div class="form-row"><label>Room type<select name="roomType" [(ngModel)]="form.roomType"><option value="single">Single</option><option value="double">Double sharing</option><option value="studio">Studio</option><option value="shared">Shared</option></select></label><label>Nearby college<input name="college" [(ngModel)]="form.college" /></label></div>
          <label>Facilities, comma separated<input name="facilities" [(ngModel)]="facilitiesText" placeholder="Wi-Fi, meals, laundry" /></label>
          <label>House rules, comma separated<input name="rules" [(ngModel)]="rulesText" placeholder="No smoking, quiet hours" /></label>
          <label>Photo URL<input name="imageUrl" [(ngModel)]="imageUrl" type="url" placeholder="https://..." /></label>
          <div class="form-actions"><button class="primary" type="submit" [disabled]="saving">{{ saving ? 'Saving...' : (editingId ? 'Save changes' : 'Submit for review') }}</button><button *ngIf="editingId" type="button" class="secondary" (click)="cancelEdit()">Cancel edit</button></div>
        </form>

        <section class="listings"><div class="section-heading"><div><p class="eyebrow">Inventory</p><h2>Submitted listings</h2></div></div>
          <p class="loading" *ngIf="loading">Loading your rooms...</p>
          <article class="listing-row" *ngFor="let room of rooms"><div class="listing-summary"><strong>{{ room.title }}</strong><span>{{ room.city || room.location }} &middot; &#8377;{{ room.rent | number }}/mo</span><span class="status" [class.pending]="room.isActive && room.verificationStatus !== 'approved'" [class.inactive]="!room.isActive">{{ room.isActive ? (room.verificationStatus | titlecase) : 'Inactive' }}</span></div>
            <div class="listing-actions" *ngIf="room.isActive"><select aria-label="Listing availability" [(ngModel)]="room.availability" [ngModelOptions]="{standalone:true}" (ngModelChange)="updateAvailability(room)"><option value="available">Available</option><option value="occupied">Occupied</option><option value="booked">Booked</option></select><button type="button" (click)="editRoom(room)">Edit</button><button type="button" class="danger" (click)="deactivate(room)">Deactivate</button></div>
          </article>
          <div class="empty" *ngIf="!loading && !rooms.length">No listings yet. Add your first room with the form.</div>
        </section>
      </div>

      <section class="requests"><div class="section-heading"><div><p class="eyebrow">Guest communication</p><h2>Visit requests</h2></div><span>{{ requests.length }} requests</span></div>
        <article class="request-row" *ngFor="let request of requests"><div><strong>{{ title(request) }}</strong><span>{{ studentName(request) }} &middot; {{ request.createdAt | date:'mediumDate' }}</span></div><span class="request-status" [class.pending]="request.status === 'pending'">{{ request.status | titlecase }}</span><div class="request-actions" *ngIf="request.status === 'pending'"><button type="button" class="primary" (click)="updateRequest(request, 'accepted')">Accept</button><button type="button" class="secondary" (click)="updateRequest(request, 'rejected')">Decline</button></div></article>
        <p class="empty" *ngIf="!loading && !requests.length">Visit requests from students will appear here.</p>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:70vh; background:var(--paper,#f5f4ec); color:var(--ink,#202a24); }.owner-page { max-width:1320px; margin:auto; padding:48px 24px 74px; }.page-heading,.section-heading { display:flex; align-items:end; justify-content:space-between; gap:20px; }.page-heading { margin-bottom:32px; }.eyebrow { color:var(--green,#315d46); font-size:.72rem; font-weight:800; text-transform:uppercase; }.page-heading h1 { margin:7px 0; font:2.8rem Georgia,serif; }.page-heading p:last-child { color:var(--muted,#69756c); font-size:.88rem; }.total,.section-heading>span { color:var(--muted,#69756c); font-size:.83rem; }.owner-layout { display:grid; grid-template-columns:minmax(310px,.72fr) minmax(0,1.28fr); gap:28px; align-items:start; }.listing-form,.listings { padding:24px; background:var(--surface,#fffefa); border:1px solid var(--line,#dedfd3); }.listing-form h2,.section-heading h2 { margin:0; font:1.7rem Georgia,serif; }.listing-form h2 { margin-bottom:15px; }.listing-form label { display:grid; gap:6px; padding:7px 0; color:var(--muted,#69756c); font-size:.73rem; font-weight:700; }.listing-form input,.listing-form select,.listing-form textarea { width:100%; min-width:0; min-height:38px; padding:8px 9px; border:1px solid var(--line,#dedfd3); background:transparent; color:var(--ink,#202a24); font-size:.85rem; }.listing-form textarea { resize:vertical; }.form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }.form-actions { display:flex; gap:9px; margin-top:12px; }.primary,.secondary { min-height:38px; padding:0 12px; border:1px solid var(--green,#315d46); font-size:.76rem; font-weight:700; cursor:pointer; }.primary { background:var(--green,#315d46); color:white; }.primary:disabled { opacity:.55; cursor:wait; }.secondary { background:transparent; color:var(--green,#315d46); }.section-heading { margin-bottom:17px; }.section-heading .eyebrow { margin:0 0 7px; }.listing-row { padding:15px 0; display:flex; justify-content:space-between; align-items:center; gap:12px; border-top:1px solid var(--line,#dedfd3); }.listing-summary { display:grid; gap:5px; }.listing-summary strong { font-size:.87rem; }.listing-summary>span:nth-child(2) { color:var(--muted,#69756c); font-size:.76rem; }.status,.request-status { width:max-content; padding:5px 8px; background:#e5ecdf; color:#315d46; font-size:.66rem; font-weight:800; text-transform:uppercase; }.status.pending,.request-status.pending { background:#f4e7cd; color:#7b5721; }.listing-actions { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }.listing-actions button,.listing-actions select { min-height:33px; padding:0 8px; border:1px solid var(--line,#dedfd3); background:transparent; color:var(--ink,#202a24); font-size:.7rem; cursor:pointer; }.listing-actions .danger { color:#8b4634; }.empty,.loading { padding:22px 0; color:var(--muted,#69756c); font-size:.84rem; }.requests { margin-top:34px; padding-top:26px; border-top:1px solid var(--line,#dedfd3); }.request-row { min-height:68px; padding:12px 15px; display:flex; align-items:center; gap:16px; background:var(--surface,#fffefa); border-bottom:1px solid var(--line,#dedfd3); }.request-row>div:first-child { flex:1; display:grid; gap:5px; }.request-row strong { font-size:.84rem; }.request-row>div>span { color:var(--muted,#69756c); font-size:.76rem; }.request-actions { display:flex; gap:7px; }
      .status.inactive { background:#eee9e3; color:#766d62; }
    @media(max-width:950px) { .owner-layout { grid-template-columns:1fr; } }
    @media(max-width:650px) { .owner-page { padding:34px 16px 50px; }.page-heading h1 { font-size:2.2rem; }.listing-form,.listings { padding:18px; }.listing-row { align-items:start; flex-direction:column; }.request-row { align-items:start; flex-wrap:wrap; }.request-row>div:first-child { flex-basis:100%; }.form-row { gap:8px; } }
  `]
})
export class OwnerDashboardPageComponent implements OnInit {
  rooms: Room[] = [];
  requests: VisitRequest[] = [];
  loading = true;
  saving = false;
  editingId: string | null = null;
  formAvailability: Room['availability'] = 'available';
  facilitiesText = '';
  rulesText = '';
  imageUrl = '';
  form: Omit<RoomInput, 'facilities' | 'rules' | 'imageUrls'> = this.emptyForm();

  constructor(private readonly roomsApi: RoomApiService, private readonly visitsApi: VisitApiService, private readonly notifications: NotificationService, readonly auth: AuthService) {}

  ngOnInit(): void {
    this.loadRooms();
    this.visitsApi.getMine().subscribe({ next: (requests) => this.requests = requests, error: () => this.notifications.show('Could not load visit requests.', true) });
  }

  saveRoom(): void {
    this.saving = true;
    const payload: RoomInput = {
      ...this.form,
      facilities: this.splitList(this.facilitiesText),
      rules: this.splitList(this.rulesText),
      imageUrls: this.imageUrl.trim() ? [this.imageUrl.trim()] : [],
      availability: this.formAvailability,
    };
    const action = this.editingId ? this.roomsApi.update(this.editingId, payload) : this.roomsApi.create(payload);
    action.subscribe({
      next: ({ message }) => { this.saving = false; this.notifications.show(message); this.cancelEdit(); this.loadRooms(); },
      error: (error) => { this.saving = false; this.notifications.show(error.error?.message || 'Listing could not be saved.', true); },
    });
  }

  editRoom(room: Room): void {
    this.editingId = room._id;
    this.formAvailability = room.availability;
    const { facilities, rules, imageUrls, availability: _availability, ...details } = room;
    this.form = { ...details, roomType: room.roomType };
    this.facilitiesText = facilities.join(', ');
    this.rulesText = rules.join(', ');
    this.imageUrl = imageUrls[0] || '';
    document.querySelector('.listing-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelEdit(): void { this.editingId = null; this.formAvailability = 'available'; this.form = this.emptyForm(); this.facilitiesText = ''; this.rulesText = ''; this.imageUrl = ''; }

  updateAvailability(room: Room): void {
    this.roomsApi.updateAvailability(room._id, room.availability).subscribe({
      next: ({ message }) => this.notifications.show(message),
      error: (error) => { this.notifications.show(error.error?.message || 'Availability could not be changed.', true); this.loadRooms(); },
    });
  }

  deactivate(room: Room): void {
    if (!window.confirm(`Deactivate ${room.title}?`)) return;
    this.roomsApi.deactivate(room._id).subscribe({
      next: ({ message }) => { this.notifications.show(message); this.loadRooms(); },
      error: (error) => this.notifications.show(error.error?.message || 'Listing could not be deactivated.', true),
    });
  }

  updateRequest(request: VisitRequest, status: 'accepted' | 'rejected'): void {
    this.visitsApi.update(request._id, status).subscribe({
      next: ({ message }) => { request.status = status; this.notifications.show(message); },
      error: (error) => this.notifications.show(error.error?.message || 'Request could not be updated.', true),
    });
  }

  title(request: VisitRequest): string { return typeof request.room === 'object' && request.room ? request.room.title : 'Rental listing'; }
  studentName(request: VisitRequest): string { return typeof request.user === 'object' && request.user ? request.user.name : 'Student'; }

  private loadRooms(): void {
    this.loading = true;
    this.roomsApi.getOwnerRooms().subscribe({ next: (rooms) => { this.rooms = rooms; this.loading = false; }, error: () => { this.loading = false; this.notifications.show('Could not load your listings.', true); } });
  }

  private splitList(value: string): string[] { return value.split(',').map((item) => item.trim()).filter(Boolean); }

  private emptyForm(): Omit<RoomInput, 'facilities' | 'rules' | 'imageUrls'> {
    return { title: '', description: '', location: '', address: '', city: '', college: '', rent: 0, deposit: 0, roomType: 'single' as RoomType };
  }
}
