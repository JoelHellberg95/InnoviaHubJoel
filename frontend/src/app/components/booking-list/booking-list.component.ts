import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, output, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BookingRead } from '../ResourceMenu/models/booking.model';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.css',
})
export class BookingListComponent {
  @Input() items: BookingRead[] = [];
  @Input() selectedId: number | null = null;
  @Input() loading: boolean = false;
  @Input() error: string = '';
  @Input() search: string = '';

  private router = inject(Router);
  
  bookingSelected = output<number>();
  searchChange = output<string>();

  shortGuid(guid: string) {
    return guid?.length > 10 ? `${guid.slice(0, 8)}…${guid.slice(-4)}` : guid;
  }

  onSearchInput(value: string) {
    this.searchChange.emit(value);
  }

  goToMeetingRoom(bookingId: number, event: Event) {
    event.stopPropagation(); // Förhindra att bokningen markeras som vald
    this.router.navigate(['/motesrum', bookingId]);
  }

  isToday(dateString: string): boolean {
    const bookingDate = new Date(dateString);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  }

  isFuture(dateString: string): boolean {
    const bookingDate = new Date(dateString);
    const now = new Date();
    return bookingDate > now;
  }
}
