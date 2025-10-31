import { Injectable, OnInit } from '@angular/core';
import { AppConfigService } from '../../../core/app-config.service';
import { catchError, Observable, throwError } from 'rxjs';
import {
  Booking,
  BookingRead,
  BookingUpdateDto,
} from '../models/booking.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly url: string;

  constructor(private http: HttpClient, private cfg: AppConfigService) {
    this.url = `${this.cfg.apiUrl}/api/booking`;
    console.log('BookingService URL:', this.url);
  }

  postNewBooking(booking: Booking): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      observe: 'response' as const,
    };

    return this.http.post<any>(this.url, booking, httpOptions).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  getAll(): Observable<BookingRead[]> {
    return this.http.get<BookingRead[]>(this.url);
  }

  getById(id: number): Observable<BookingRead> {
    return this.http.get<BookingRead>(`${this.url}/${id}`);
  }

  update(id: number, dto: BookingUpdateDto): Observable<BookingRead> {
    return this.http.put<BookingRead>(`${this.url}/${id}`, dto);
  }

  delete(id: number, userId?: string): Observable<void> {
    const params = userId ? `?userId=${userId}` : '';
    return this.http.delete<void>(`${this.url}/${id}${params}`);
  }
}
