import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { API_BASE } from '../../core/api-base';
import { Room, RoomType } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { RoomApiService } from '../../core/services/room-api.service';
import { RoomCardComponent } from '../../shared/room-card/room-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RoomCardComponent],
  template: `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><span class="status-dot" [class.online]="apiOnline"></span>{{ apiOnline ? 'Local stays, carefully found' : 'API offline - start the server to search' }}</p>
        <h1>A place to land.<br /><em>A place to grow.</em></h1>
        <p class="description">Find student-friendly rooms, clear monthly prices, and hosts who make a new city feel familiar.</p>
        <form class="search-form" (ngSubmit)="search()">
          <label>City or locality<input name="location" [(ngModel)]="filters.location" placeholder="Try Nashik" /></label>
          <label>Maximum monthly rent<input name="maxRent" [(ngModel)]="filters.maxRent" type="number" min="0" placeholder="Any budget" /></label>
          <label>Room setup<select name="roomType" [(ngModel)]="filters.roomType"><option value="all">Any type</option><option value="single">Single room</option><option value="double">Double sharing</option><option value="studio">Studio</option><option value="shared">Shared room</option></select></label>
          <button class="primary-button" type="submit">Find a room <span aria-hidden="true">&#8594;</span></button>
        </form>
      </div>
      <div class="hero-image" role="img" aria-label="Bright, welcoming student accommodation"><div><span>Find your next chapter</span><strong>Made for student life.</strong></div></div>
    </section>

    <section class="benefits" aria-label="Buddha Rental benefits"><span>Thoughtful stays</span><span>Clear monthly costs</span><span>Hosts you can reach</span></section>

    <section class="listings" id="available-rooms">
      <div class="section-heading"><div><p class="eyebrow">Your search starts here</p><h2>Rooms worth coming home to</h2></div><span>{{ total }} listings</span></div>
      <p class="notice error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <div class="room-grid" *ngIf="!loading && rooms.length">
        <app-room-card *ngFor="let room of rooms" [room]="room" [saved]="savedIds.has(room._id)" (save)="toggleSaved($event)" />
      </div>
      <div class="empty-state" *ngIf="!loading && !rooms.length"><h3>No rooms match those filters</h3><p>Try another locality or widen your monthly budget.</p><button class="text-button" type="button" (click)="clearSearch()">Clear filters</button></div>
      <p class="loading" *ngIf="loading">Finding available rooms...</p>
      <nav class="pagination" *ngIf="!loading && pages > 1" aria-label="Room pages">
        <button type="button" [disabled]="page <= 1" (click)="load(page - 1)">Previous</button><span>Page {{ page }} of {{ pages }}</span><button type="button" [disabled]="page >= pages" (click)="load(page + 1)">Next</button>
      </nav>
    </section>

    <section class="steps-section" id="how-it-works">
      <div class="section-heading"><div><p class="eyebrow">A simpler move</p><h2>From search to settling in</h2></div></div>
      <div class="steps"><article><span>01</span><h3>Find your fit</h3><p>Compare approved listings by location, budget, and room type.</p></article><article><span>02</span><h3>Meet the host</h3><p>Send a visit request and arrange a time that works for you.</p></article><article><span>03</span><h3>Make it yours</h3><p>See the place in person and choose with confidence.</p></article></div>
    </section>
  `,
  styles: [`
    :host { display:block; color:var(--ink,#202a24); }
    .hero { max-width:1440px; margin:0 auto; padding:65px max(6vw,24px) 58px; display:grid; grid-template-columns:minmax(0,1.12fr) minmax(320px,.88fr); gap:5vw; align-items:center; }
    .eyebrow { display:flex; align-items:center; gap:9px; margin:0 0 17px; color:var(--green,#315d46); font-size:.73rem; font-weight:800; text-transform:uppercase; }
    .status-dot { width:8px; height:8px; border-radius:50%; background:#b66b52; }.status-dot.online { background:#4e9a69; }
    h1 { margin:0; font:4.3rem/1.02 Georgia,serif; letter-spacing:0; } h1 em { color:var(--green,#315d46); font-weight:400; }
    .description { max-width:490px; margin:22px 0 29px; color:var(--muted,#69756c); font-size:1.02rem; line-height:1.7; }
    .search-form { display:grid; grid-template-columns:1.2fr 1fr 1fr auto; gap:0; align-items:end; padding:12px; background:var(--surface,#fffefa); border:1px solid var(--line,#dedfd3); box-shadow:0 12px 35px rgba(45,61,48,.08); }
    label { display:grid; gap:7px; min-width:0; padding:6px 11px; color:var(--muted,#69756c); font-size:.7rem; font-weight:700; }
    label+label { border-left:1px solid var(--line,#dedfd3); }
    input,select { width:100%; min-width:0; height:38px; padding:0; border:0; border-bottom:1px solid var(--line,#dedfd3); border-radius:0; outline:0; background:transparent; color:var(--ink,#202a24); font-size:.84rem; }
    input:focus,select:focus { border-color:var(--green,#315d46); }
    .primary-button { min-height:47px; padding:0 16px; border:0; background:var(--green,#315d46); color:white; font-size:.83rem; font-weight:700; cursor:pointer; }.primary-button:hover { background:var(--green-dark,#244735); }.primary-button span { padding-left:8px; }
    .hero-image { min-height:375px; position:relative; background:#cad2bd url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85') center/cover no-repeat; }
    .hero-image::after { content:''; position:absolute; inset:35% 0 0; background:linear-gradient(transparent,rgba(21,35,25,.7)); }
    .hero-image div { position:absolute; z-index:1; bottom:23px; left:25px; display:grid; gap:5px; color:white; }.hero-image span { font-size:.75rem; font-weight:700; text-transform:uppercase; }.hero-image strong { font:1.8rem Georgia,serif; }
    .benefits { min-height:83px; padding:20px 10vw; display:flex; justify-content:space-between; align-items:center; gap:20px; background:var(--green,#315d46); color:white; font-size:.9rem; }
    .listings,.steps-section { max-width:1320px; margin:0 auto; padding:72px 24px; }
    .section-heading { display:flex; justify-content:space-between; align-items:end; gap:20px; margin-bottom:28px; }.section-heading .eyebrow { margin-bottom:10px; }.section-heading h2 { margin:0; font:2.6rem Georgia,serif; }.section-heading>span { padding-bottom:6px; color:var(--muted,#69756c); font-size:.85rem; }
    .room-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:22px; }
    .notice { padding:12px 15px; margin-bottom:18px; font-size:.85rem; }.error { color:#8b4634; background:#f2e5df; }
    .empty-state { padding:55px 20px; background:#eeeee5; text-align:center; }.empty-state h3 { margin:0; font:1.55rem Georgia,serif; }.empty-state p,.loading { color:var(--muted,#69756c); }.text-button { border:0; background:transparent; color:var(--green,#315d46); font-weight:700; cursor:pointer; }
    .loading { min-height:110px; display:grid; place-items:center; }.pagination { display:flex; justify-content:center; align-items:center; gap:16px; margin-top:26px; }.pagination button { min-height:38px; padding:0 13px; border:1px solid var(--line,#dedfd3); background:var(--surface,#fffefa); color:var(--green,#315d46); cursor:pointer; }.pagination button:disabled { opacity:.45; cursor:not-allowed; }.pagination span { color:var(--muted,#69756c); font-size:.82rem; }
    .steps-section { border-top:1px solid var(--line,#dedfd3); }.steps { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--line,#dedfd3); border-bottom:1px solid var(--line,#dedfd3); }.steps article { padding:22px 26px 26px 0; }.steps article+article { padding-left:26px; border-left:1px solid var(--line,#dedfd3); }.steps article>span { color:var(--coral,#cf684d); font:1rem Georgia,serif; }.steps h3 { margin:18px 0 8px; font:1.35rem Georgia,serif; }.steps p { max-width:290px; margin:0; color:var(--muted,#69756c); font-size:.88rem; line-height:1.6; }
    @media(max-width:1000px) { .hero { grid-template-columns:1fr .8fr; gap:26px; }.hero h1 { font-size:3.5rem; }.search-form { grid-template-columns:1fr 1fr; row-gap:10px; }.search-form label:nth-child(3) { border-left:0; }.room-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media(max-width:700px) { .hero { padding:42px 20px 35px; grid-template-columns:1fr; }.hero h1 { font-size:3.15rem; }.search-form { grid-template-columns:1fr; padding:10px 13px; }.search-form label { padding:8px 2px; }.search-form label+label { border-left:0; border-top:1px solid var(--line,#dedfd3); }.search-form .primary-button { margin-top:5px; }.hero-image { min-height:270px; }.benefits { padding:18px 20px; display:grid; grid-template-columns:1fr 1fr; font-size:.82rem; }.benefits span:last-child { grid-column:1/-1; }.listings,.steps-section { padding:52px 20px; }.section-heading h2 { font-size:2.05rem; }.room-grid,.steps { grid-template-columns:1fr; }.steps article,.steps article+article { padding:19px 0; border-left:0; }.steps article+article { border-top:1px solid var(--line,#dedfd3); } }
  `]
})
export class HomePageComponent implements OnInit {
  rooms: Room[] = [];
  savedIds = new Set<string>();
  filters: { location: string; maxRent: number | null; roomType: RoomType | 'all' } = { location: '', maxRent: null, roomType: 'all' };
  loading = true;
  apiOnline = false;
  errorMessage = '';
  page = 1;
  pages = 1;
  total = 0;

  constructor(
    private readonly http: HttpClient,
    private readonly roomsApi: RoomApiService,
    private readonly auth: AuthService,
    private readonly notifications: NotificationService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.http.get<{ status: string }>(`${API_BASE}/health`).subscribe({
      next: ({ status }) => this.apiOnline = status === 'ok',
      error: () => this.apiOnline = false,
    });
    this.load();
    this.auth.restoreSession().subscribe((user) => {
      if (user) this.loadSaved();
    });
  }

  search(): void { this.load(1); }
  clearSearch(): void { this.filters = { location: '', maxRent: null, roomType: 'all' }; this.load(1); }

  load(page = this.page): void {
    this.loading = true;
    this.errorMessage = '';
    this.roomsApi.search({ ...this.filters, availability: 'available', page, limit: 12 })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (result) => { this.rooms = result.rooms; this.page = result.page; this.pages = result.pages; this.total = result.total; },
        error: (error) => this.errorMessage = error.error?.message || 'Could not load rooms. Is the API running?',
      });
  }

  toggleSaved(room: Room): void {
    if (!this.auth.user()) {
      this.router.navigate(['/login'], { queryParams: { redirect: '/' } });
      return;
    }
    this.roomsApi.toggleFavourite(room._id).subscribe({
      next: () => {
        const next = new Set(this.savedIds);
        if (next.has(room._id)) next.delete(room._id); else next.add(room._id);
        this.savedIds = next;
        this.notifications.show(next.has(room._id) ? 'Room saved.' : 'Room removed from saved rooms.');
      },
      error: (error) => this.notifications.show(error.error?.message || 'Could not update saved rooms.', true),
    });
  }

  private loadSaved(): void {
    this.roomsApi.getFavourites().subscribe({ next: (rooms) => this.savedIds = new Set(rooms.map((room) => room._id)) });
  }
}
