import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking } from '../ResourceMenu/models/booking.model';
import { BookingService } from '../ResourceMenu/Services/booking.service';
import { BookingConfirmationPopupComponent } from '../booking-confirmation-popup/booking-confirmation-popup.component';
import { AuthService } from '../../services/auth.service';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-bookingpage-list',
  standalone: true,
  imports: [CommonModule, BookingConfirmationPopupComponent],
  templateUrl: './bookingpage-list.component.html',
})
export class BookingpageListComponent {
  @Input() loading = false;
  @Input() error?: string;
  @Input() resources: any[] = [];
  @Input() selectedResourceId: number | null = null;

  @Input() selectedTypeId?: number;
  @Input() selectedDate: Date | null = null;

  @Output() selectResource = new EventEmitter<{
    id: number;
    name: string;
    isAvailable: boolean;
  }>();
  @Output() bookingCommitted = new EventEmitter<void>(); // meddela parent efter lyckad bokning

  // UI-state
  confirmationIsVisible = false;
  isBooked = false;
  errorMessage = '';
  createdBookingId: number | null = null;

  private bookingApi = inject(BookingService);
  private authService = inject(AuthService);

  get selectedResourceName(): string | null {
    const r = this.resources?.find(
      (x: any) => x.id === this.selectedResourceId
    );
    return r?.name ?? null;
  }

  handleClickBook() {
    const screenWidth = window.innerWidth;

    // Mobile: guida användaren till saknade steg
    if (screenWidth < 768) {
      if (!this.selectedTypeId)
        return document.getElementById('resourceType')?.scrollIntoView();
      else if (!this.selectedDate)
        return document.getElementById('calendar')?.scrollIntoView();
      else if (!this.selectedResourceId)
        return document.getElementById('resourceList')?.scrollIntoView();
    }

    // Desktop: kräver alla val
    if (!this.selectedTypeId || !this.selectedDate || !this.selectedResourceId)
      return;

    // nollställ och visa popup
    this.isBooked = false;
    this.errorMessage = '';
    this.confirmationIsVisible = true;
  }

  async receiveButtonClickedFromConfirmation(e: string) {
    if (e === 'cancel' || e === 'stay') {
      this.confirmationIsVisible = false;
      this.isBooked = false;
      this.createdBookingId = null;
      return;
    }

    if (this.selectedDate && this.selectedResourceId) {
      const { start, end } = this.getUtcDayRange(this.selectedDate);

      const currentUserId = this.authService.getUserId();
      const currentUserName = this.authService.getUserName();
      if (!currentUserId) {
        console.error('❌ Cannot create booking: User not logged in');
        return;
      }

      const newBooking: Booking = {
        userId: currentUserId,
        userName: currentUserName,
        resourceId: this.selectedResourceId,
        startTime: start,
        endTime: end,
        status: 'Confirmed',
      };

      this.postNewBooking(newBooking);
    }
  }

  postNewBooking(booking: Booking) {
    if (!this.authService.isAdmin() && !this.authService.isUser())
      return console.error('Unauthorized');

    this.bookingApi.postNewBooking(booking).subscribe(
      (response: HttpResponse<any>) => {
        if (response.status > 201) {
          this.confirmationIsVisible = false;
          return;
        }
        this.isBooked = true;
        this.createdBookingId = response.body?.id || null;

        // be parent (pane) att ladda om resources direkt
        this.bookingCommitted.emit();

        // (valfritt) optimistisk lokalt:
        this.resources = this.resources.map((it: any) =>
          it.id === this.selectedResourceId ? { ...it, isAvailable: false } : it
        );
      },
      (error: any) => {
        console.error('Status code: ', error.status);
        if (error.status === 409) {
          this.errorMessage = `${this.selectedResourceName} är upptagen.`;
          this.confirmationIsVisible = false;
        }
      }
    );
  }

  private getUtcDayRange(d: Date) {
    const isoDate = d.toISOString().split('T')[0]; // YYYY-MM-DD baserat på d i UTC
    return {
      start: new Date(`${isoDate}T00:00:00.000Z`),
      end: new Date(`${isoDate}T23:59:59.999Z`),
    };
  }
}
