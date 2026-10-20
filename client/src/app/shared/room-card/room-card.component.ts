import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Room } from '../../core/models/api.models';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article class="room-card">
      <a class="room-image" [routerLink]="['/rooms', room._id]">
        <img [src]="room.imageUrls[0] || fallbackImage" [alt]="room.title" />
        <span class="availability">{{ room.availability | titlecase }}</span>
      </a>
      <div class="room-body">
        <div class="room-meta"><span>{{ room.city || room.location }}</span><strong>&#8377;{{ room.rent | number }}/mo</strong></div>
        <h3><a [routerLink]="['/rooms', room._id]">{{ room.title }}</a></h3>
        <p>{{ room.college ? 'Near ' + room.college : room.location }}</p>
        <div class="room-facts"><span>{{ room.roomType | titlecase }}</span><span>Deposit &#8377;{{ room.deposit | number }}</span></div>
        <div class="room-actions">
          <a [routerLink]="['/rooms', room._id]">View details <span aria-hidden="true">&#8594;</span></a>
          <button *ngIf="showSave" type="button" [attr.aria-label]="saved ? 'Remove from saved rooms' : 'Save room'" (click)="save.emit(room)">{{ saved ? 'Saved' : 'Save' }}</button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .room-card { height: 100%; background: var(--surface, #fffefa); border: 1px solid var(--line, #dedfd3); }
    .room-image { height: 220px; display: block; position: relative; overflow: hidden; background: #dfe2d5; }
    img { width: 100%; height: 100%; object-fit: cover; transition: transform 180ms ease; }
    .room-card:hover img { transform: scale(1.025); }
    .availability { position: absolute; top: 13px; left: 13px; padding: 7px 10px; background: #fffefa; color: #315d46; font-size: .7rem; font-weight: 800; text-transform: capitalize; }
    .room-body { padding: 18px; }
    .room-meta, .room-facts, .room-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .room-meta { color: #69756c; font-size: .78rem; }
    .room-meta strong { color: #244735; }
    h3 { margin: 12px 0 5px; font: 1.3rem Georgia, serif; }
    h3 a { text-decoration: none; color: inherit; }
    p { min-height: 1.3em; margin: 0; color: #69756c; font-size: .82rem; }
    .room-facts { margin: 16px 0; padding-top: 12px; border-top: 1px solid #dedfd3; color: #515d54; font-size: .75rem; }
    .room-actions { padding-top: 10px; border-top: 1px solid #dedfd3; }
    .room-actions a, .room-actions button { padding: 0; border: 0; background: transparent; color: #315d46; font-size: .82rem; font-weight: 800; text-decoration: none; cursor: pointer; }
    @media (max-width: 600px) { .room-image { height: 230px; } }
  `]
})
export class RoomCardComponent {
  @Input({ required: true }) room!: Room;
  @Input() saved = false;
  @Input() showSave = true;
  @Output() save = new EventEmitter<Room>();
  readonly fallbackImage = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80';
}
