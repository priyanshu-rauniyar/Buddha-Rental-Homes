import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Review, Room, VisitRequest } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { ReviewApiService } from '../../core/services/review-api.service';
import { RoomApiService } from '../../core/services/room-api.service';
import { VisitApiService } from '../../core/services/visit-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="room-page">
      <a class="back-link" routerLink="/">&#8592; Browse all rooms</a>
      <p class="loading" *ngIf="loading">Loading room details...</p>
      <section class="error-state" *ngIf="!loading && errorMessage"><h1>Room unavailable</h1><p>{{ errorMessage }}</p></section>
      <article class="room-detail" *ngIf="room && !loading">
        <div class="gallery">
          <img [src]="room.imageUrls[0] || fallbackImage" [alt]="room.title" />
          <div class="gallery-extra" *ngIf="room.imageUrls.length > 1"><img *ngFor="let image of room.imageUrls.slice(1, 4)" [src]="image" [alt]="room.title" /></div>
        </div>
        <div class="detail-layout">
          <section class="main-info">
            <p class="eyebrow">{{ room.city || room.location }} &middot; {{ room.roomType | titlecase }}</p>
            <h1>{{ room.title }}</h1>
            <p class="address">{{ room.address }}</p>
            <p class="description">{{ room.description }}</p>
            <div class="features"><span *ngFor="let facility of room.facilities">{{ facility }}</span></div>
            <h2>House rules</h2>
            <ul><li *ngFor="let rule of room.rules">{{ rule }}</li><li *ngIf="!room.rules.length">Ask the host about house rules before visiting.</li></ul>
            <section class="reviews">
              <div class="review-title"><div><p class="eyebrow">Student experiences</p><h2>Reviews</h2></div><strong>{{ averageRating | number:'1.1-1' }} / 5 <small>({{ reviewCount }})</small></strong></div>
              <form class="review-form" *ngIf="canReview" (ngSubmit)="submitReview()">
                <label>Rating<select name="rating" [(ngModel)]="reviewForm.rating"><option [ngValue]="5">5 - Excellent</option><option [ngValue]="4">4 - Good</option><option [ngValue]="3">3 - Fair</option><option [ngValue]="2">2 - Poor</option><option [ngValue]="1">1 - Very poor</option></select></label>
                <label>Your review<textarea name="comment" [(ngModel)]="reviewForm.comment" required minlength="5" maxlength="1000" rows="3"></textarea></label>
                <button class="primary-button" type="submit">Submit review</button>
              </form>
              <p class="hint" *ngIf="user?.role === 'student' && !canReview">Review access opens after the host accepts a visit request.</p>
              <article class="review" *ngFor="let review of reviews">
                <div class="review-top"><strong>{{ author(review) }}</strong><span>{{ review.createdAt | date:'mediumDate' }}</span></div>
                <strong class="rating">{{ review.rating }} / 5</strong><p>{{ review.comment }}</p>
                <button *ngIf="canDelete(review)" type="button" class="delete" (click)="deleteReview(review)">Delete review</button>
              </article>
              <p class="hint" *ngIf="!reviewCount">No reviews yet.</p>
            </section>
          </section>
          <aside class="booking-panel">
            <span class="availability">{{ room.availability | titlecase }}</span>
            <p class="rent">&#8377;{{ room.rent | number }} <small>/ month</small></p>
            <p class="deposit">Deposit &#8377;{{ room.deposit | number }}</p>
            <button type="button" class="primary-button" (click)="requestVisit()">Request a visit</button>
            <p class="host">Hosted by <strong>{{ hostName }}</strong></p>
            <p class="college" *ngIf="room.college">Near {{ room.college }}</p>
          </aside>
        </div>
      </article>
    </main>
  `,
  styles: [`
    :host { display:block; background:var(--paper,#f5f4ec); color:var(--ink,#202a24); min-height:70vh; }
    .room-page { max-width:1240px; margin:auto; padding:38px 24px 70px; }
    .back-link { color:var(--green,#315d46); font-size:.84rem; text-decoration:none; }
    .loading { min-height:45vh; display:grid; place-items:center; color:var(--muted,#69756c); }
    .error-state { margin-top:50px; padding:45px; background:#fffefa; }
    .error-state h1 { font:2.4rem Georgia,serif; }
    .gallery { display:grid; grid-template-columns:1.5fr 1fr; gap:12px; height:420px; margin:24px 0 30px; }
    .gallery>img,.gallery-extra img { width:100%; height:100%; object-fit:cover; }
    .gallery-extra { display:grid; grid-template-rows:repeat(3,1fr); gap:12px; min-height:0; overflow:hidden; }
    .detail-layout { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:48px; align-items:start; }
    .eyebrow { color:var(--green,#315d46); font-size:.72rem; font-weight:800; text-transform:uppercase; }
    .main-info h1 { margin:7px 0; font:3rem Georgia,serif; }
    .address,.deposit,.college { color:var(--muted,#69756c); font-size:.87rem; }
    .description { margin:25px 0; color:#515d54; line-height:1.7; }
    .features { display:flex; flex-wrap:wrap; gap:8px; margin:20px 0 34px; }
    .features span { padding:8px 10px; background:#e7ecdf; color:#315d46; font-size:.76rem; }
    .main-info h2 { margin:25px 0 12px; font:1.5rem Georgia,serif; }
    .main-info ul { padding-left:18px; color:#59645b; line-height:1.8; }
    .booking-panel { position:sticky; top:24px; padding:24px; background:var(--surface,#fffefa); border:1px solid var(--line,#dedfd3); }
    .availability { padding:6px 9px; background:#e6eddf; color:#315d46; font-size:.7rem; font-weight:800; text-transform:uppercase; }
    .rent { margin:20px 0 0; color:#244735; font-size:1.6rem; font-weight:800; }
    .rent small { color:var(--muted,#69756c); font-size:.8rem; font-weight:500; }
    .booking-panel>.primary-button { width:100%; min-height:46px; margin-top:17px; border:0; background:#315d46; color:white; font-weight:700; cursor:pointer; }
    .host { padding-top:20px; margin-top:20px; border-top:1px solid var(--line,#dedfd3); color:var(--muted,#69756c); font-size:.82rem; }
    .host strong { color:var(--ink,#202a24); }
    .reviews { margin-top:42px; padding-top:24px; border-top:1px solid var(--line,#dedfd3); }
    .review-title { display:flex; justify-content:space-between; align-items:end; }
    .review-title .eyebrow { margin:0 0 8px; }.review-title h2 { margin:0; }
    .review-title>strong { color:#315d46; font-size:.85rem; }.review-title small { color:var(--muted,#69756c); font-weight:500; }
    .review-form { display:grid; gap:12px; margin:20px 0; }
    .review-form label { display:grid; gap:6px; color:var(--muted,#69756c); font-size:.76rem; font-weight:700; }
    .review-form select,.review-form textarea { padding:10px; border:1px solid var(--line,#dedfd3); background:transparent; }
    .review-form .primary-button { justify-self:start; min-height:40px; padding:0 15px; border:0; background:#315d46; color:white; }
    .review { padding:17px 0; border-top:1px solid var(--line,#dedfd3); }
    .review-top { display:flex; justify-content:space-between; gap:12px; font-size:.83rem; }
    .review-top span,.hint { color:var(--muted,#69756c); font-size:.79rem; }
    .rating { display:block; margin-top:7px; color:#315d46; font-size:.8rem; }
    .review p { color:#59645b; font-size:.87rem; line-height:1.55; }
    .delete { padding:0; border:0; background:transparent; color:#8b4634; font-size:.77rem; cursor:pointer; }
    @media(max-width:850px) { .gallery { height:330px; }.detail-layout { grid-template-columns:1fr; }.booking-panel { position:static; grid-row:1; }.booking-panel>.primary-button { width:auto; padding:0 18px; } }
    @media(max-width:600px) { .room-page { padding:25px 16px 50px; }.gallery { height:255px; grid-template-columns:1fr; }.gallery-extra { display:none; }.main-info h1 { font-size:2.25rem; }.booking-panel { padding:19px; } }
  `]
})
export class RoomDetailPageComponent implements OnInit {
  room: Room | null = null;
  reviews: Review[] = [];
  requests: VisitRequest[] = [];
  loading = true;
  errorMessage = '';
  averageRating = 0;
  reviewCount = 0;
  reviewForm = { rating: 5, comment: '' };
  readonly fallbackImage = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly roomsApi: RoomApiService,
    private readonly reviewsApi: ReviewApiService,
    private readonly visitsApi: VisitApiService,
    private readonly auth: AuthService,
    private readonly notifications: NotificationService,
  ) {}

  get user() { return this.auth.user(); }
  get hostName(): string { return this.room && this.room.owner && typeof this.room.owner === 'object' ? this.room.owner.name : 'Verified host'; }
  get canReview(): boolean {
    if (this.user?.role !== 'student' || !this.room) return false;
    return this.requests.some((request) => request.status === 'accepted' && typeof request.room === 'object' && request.room._id === this.room?._id);
  }

  ngOnInit(): void {
    this.auth.restoreSession().subscribe(() => {
      this.route.paramMap.pipe(switchMap((params) => {
        this.loading = true;
        return this.roomsApi.getById(params.get('id') || '');
      })).subscribe({
        next: (room) => { this.room = room; this.loading = false; this.loadReviews(room._id); this.loadRequests(); },
        error: (error) => { this.errorMessage = error.error?.message || 'This listing could not be found.'; this.loading = false; },
      });
    });
  }

  requestVisit(): void {
    if (!this.room) return;
    if (!this.user) { void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } }); return; }
    if (this.user.role !== 'student') { this.notifications.show('Sign in with a student account to request a visit.', true); return; }
    this.visitsApi.requestVisit(this.room._id).subscribe({
      next: ({ message }) => { this.notifications.show(message); this.loadRequests(); },
      error: (error) => this.notifications.show(error.error?.message || 'Visit request failed.', true),
    });
  }

  submitReview(): void {
    if (!this.room) return;
    this.reviewsApi.create(this.room._id, this.reviewForm).subscribe({
      next: ({ message }) => { this.notifications.show(message); this.reviewForm = { rating: 5, comment: '' }; this.loadReviews(this.room!._id); },
      error: (error) => this.notifications.show(error.error?.message || 'Review could not be submitted.', true),
    });
  }

  deleteReview(review: Review): void {
    if (!this.room) return;
    this.reviewsApi.delete(this.room._id, review._id).subscribe({
      next: ({ message }) => { this.notifications.show(message); this.loadReviews(this.room!._id); },
      error: (error) => this.notifications.show(error.error?.message || 'Review could not be deleted.', true),
    });
  }

  author(review: Review): string { return typeof review.user === 'object' && review.user ? review.user.name : 'Student'; }
  canDelete(review: Review): boolean {
    if (this.user?.role === 'admin') return true;
    if (!this.user || typeof review.user !== 'object' || !review.user) return false;
    const id = this.user.id || this.user._id;
    return review.user.id === id || review.user._id === id;
  }

  private loadReviews(id: string): void {
    this.reviewsApi.getForRoom(id).subscribe({
      next: (result) => { this.reviews = result.reviews; this.averageRating = result.averageRating; this.reviewCount = result.reviewCount; },
      error: () => undefined,
    });
  }

  private loadRequests(): void {
    if (!this.user) return;
    this.visitsApi.getMine().subscribe({ next: (requests) => this.requests = requests, error: () => undefined });
  }
}
