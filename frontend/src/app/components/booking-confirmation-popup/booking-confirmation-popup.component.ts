import { Component, Input, input, OnInit, output, inject } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-confirmation-popup',
  imports: [ButtonComponent, RouterLink, CommonModule],
  templateUrl: './booking-confirmation-popup.component.html',
  styleUrl: './booking-confirmation-popup.component.css',
})
export class BookingConfirmationPopupComponent implements OnInit {
  @Input() selectedDate: Date | null = null;
  @Input() selectedResourceName: string | null = null;
  @Input() bookingIsConfirmed: boolean = false;
  @Input() createdBookingId: number | null = null;

  private router = inject(Router);
  buttonClicked = output<string>();
  localDate: string | undefined = '';

  ngOnInit(): void {
    this.localDate = this.selectedDate?.toLocaleDateString();
  }

  handleCancelClick() {
    this.buttonClicked.emit('cancel');
  }
  handleBookClick() {
    this.buttonClicked.emit('confirm');
  }

  goToMeetingRoom() {
    if (this.createdBookingId) {
      this.router.navigate(['/motesrum', this.createdBookingId]);
    }
  }
}
