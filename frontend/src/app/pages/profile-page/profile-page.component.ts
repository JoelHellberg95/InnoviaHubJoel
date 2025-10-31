import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../components/ResourceMenu/Services/booking.service';
import { MeetingRecordingService } from '../../services/meeting-recording.service';
import { MeetingRecording } from '../../types/meeting-recording.interface';

export interface BookingDto {
  id: number;
  userId: string;
  userName?: string;
  resourceId: number;
  resourceName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-profile-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit {
  bookings: BookingDto[] = [];
  selectedBooking: BookingDto | null = null;
  recordings: MeetingRecording[] = [];
  selectedRecording: MeetingRecording | null = null;
  isLoading = false;
  isLoadingRecordings = false;
  errorMessage = '';
  activeTab: 'bookings' | 'recordings' = 'bookings';
  isEditing = false;
  
  editForm: any = {
    bookingDate: '',
    status: '',
    originalStartTime: '',
    originalEndTime: ''
  };
  
  minDate = '';
  userName = '';
  userEmail = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private bookingService: BookingService,
    private router: Router,
    private recordingService: MeetingRecordingService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadUserBookings();
    this.loadUserRecordings();
  }

  private loadUserData() {
    this.userName = this.authService.getUserName();
    const account = this.authService.getActiveAccount();
    this.userEmail = account?.username || (account?.idTokenClaims?.['email'] as string) || 'Ingen e-post';
  }

  private async loadUserBookings() {
    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Du måste vara inloggad för att se dina bokningar';
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'Kunde inte hämta användar-ID';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const apiUrl = (window as any).__env?.NG_APP_API_URL || 'http://localhost:5184';
      const fullUrl = `${apiUrl}/api/booking/user/${userId}`;
      
      this.bookings = await this.http.get<BookingDto[]>(fullUrl).toPromise() || [];
    } catch (error) {
      console.error('Fel vid hämtning av bokningar:', error);
      this.errorMessage = 'Kunde inte hämta dina bokningar';
    } finally {
      this.isLoading = false;
    }
  }

  selectBooking(booking: BookingDto) {
    this.selectedBooking = this.selectedBooking?.id === booking.id ? null : booking;
    this.isEditing = false;
  }

  goToMeetingRoom() {
    if (!this.selectedBooking) return;
    this.router.navigate(['/motesrum', this.selectedBooking.id]);
  }

  private async loadUserRecordings() {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) {
      return;
    }

    this.isLoadingRecordings = true;

    try {
      this.recordings = await this.recordingService.getAllRecordings(userId).toPromise() || [];
    } catch (error) {
      console.error('Fel vid hämtning av inspelningar:', error);
    } finally {
      this.isLoadingRecordings = false;
    }
  }

  selectRecording(recording: MeetingRecording) {
    this.selectedRecording = this.selectedRecording?.id === recording.id ? null : recording;
  }

  formatFileSize(bytes: number): string {
    return this.recordingService.formatFileSize(bytes);
  }

  formatDuration(seconds: number): string {
    return this.recordingService.formatDuration(seconds);
  }

  setActiveTab(tab: 'bookings' | 'recordings') {
    this.activeTab = tab;
    if (tab === 'bookings') {
      this.selectedRecording = null;
    } else {
      this.selectedBooking = null;
      this.isEditing = false;
    }
  }

  startEdit() {
    if (!this.selectedBooking) return;
    
    this.isEditing = true;
    const startDate = new Date(this.selectedBooking.startTime);
    
    const today = new Date();
    this.minDate = this.formatDateOnly(today);
    
    this.editForm = {
      bookingDate: this.formatDateOnly(startDate),
      status: this.selectedBooking.status,
      originalStartTime: this.selectedBooking.startTime,
      originalEndTime: this.selectedBooking.endTime
    };
  }

  cancelEdit() {
    this.isEditing = false;
    this.editForm = {
      bookingDate: '',
      status: '',
      originalStartTime: '',
      originalEndTime: ''
    };
  }

  async saveEdit() {
    if (!this.selectedBooking || !this.authService.isLoggedIn()) {
      this.errorMessage = 'Du måste vara inloggad för att redigera bokningar';
      return;
    }

    try {
      const originalStart = new Date(this.editForm.originalStartTime);
      const originalEnd = new Date(this.editForm.originalEndTime);
      
      const [year, month, day] = this.editForm.bookingDate.split('-');
      
      const newStartTime = new Date(originalStart);
      newStartTime.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const newEndTime = new Date(originalEnd);
      newEndTime.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));

      const bookingUpdateDto = {
        id: this.selectedBooking.id,
        resourceId: this.selectedBooking.resourceId,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString(),
        status: this.editForm.status,
        userId: this.selectedBooking.userId,
        userName: this.selectedBooking.userName
      };

      // Använd HTTP direkt istället för BookingService
      const apiUrl = (window as any).__env?.NG_APP_API_URL || 'http://localhost:5184';
      const fullUrl = `${apiUrl}/api/booking/${this.selectedBooking.id}`;
      
      const updatedBooking = await this.http.put<BookingDto>(fullUrl, bookingUpdateDto).toPromise();

      const index = this.bookings.findIndex(b => b.id === this.selectedBooking!.id);
      if (index !== -1) {
        this.bookings[index] = {
          ...this.selectedBooking,
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
          status: this.editForm.status
        };
        this.selectedBooking = this.bookings[index];
      }

      this.cancelEdit();
      
    } catch (error) {
      console.error('Fel vid uppdatering av bokning:', error);
      this.errorMessage = 'Kunde inte uppdatera bokningen. Försök igen.';
    }
  }

  async deleteBooking() {
    if (!this.selectedBooking || !this.authService.isLoggedIn()) {
      this.errorMessage = 'Du måste vara inloggad för att radera bokningar';
      return;
    }

    const confirmDelete = confirm(`Är du säker på att du vill radera bokningen för ${this.selectedBooking.resourceName}?`);
    if (!confirmDelete) {
      return;
    }

    try {
      const apiUrl = (window as any).__env?.NG_APP_API_URL || 'http://localhost:5184';
      const fullUrl = `${apiUrl}/api/booking/${this.selectedBooking.id}`;
      
      await this.http.delete(fullUrl).toPromise();

      this.bookings = this.bookings.filter(b => b.id !== this.selectedBooking!.id);
      this.selectedBooking = null;
      this.isEditing = false;
      
    } catch (error) {
      console.error('Fel vid radering av bokning:', error);
      this.errorMessage = 'Kunde inte radera bokningen. Försök igen.';
    }
  }

  onStartTimeChange() {
    console.log('Start time changed');
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}