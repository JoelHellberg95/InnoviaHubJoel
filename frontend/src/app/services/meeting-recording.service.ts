import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../core/app-config.service';
import { MeetingRecording } from '../types/meeting-recording.interface';

/**
 * Service för hantering av mötesinspeningar och transkriberingar.
 * 
 * Denna service ansvarar för:
 * - API-anrop till backend för att hämta inspelningsdata
 * - Hjälpfunktioner för formattering av metadata (filstorlek, tid)
 * - Abstraktion av backend-integration för frontend-komponenter
 * 
 * Används primärt av ProfilePageComponent för att visa inspelningshistorik
 * och av MeetingRoomPageComponent för att ladda befintliga transkriberingar.
 */
@Injectable({
  providedIn: 'root'
})
export class MeetingRecordingService {
  
  constructor(
    private http: HttpClient,              // För HTTP-anrop till backend API
    private appConfig: AppConfigService    // För att få API base URL från konfiguration
  ) {}

  /**
   * Hämtar alla inspelningar för en specifik användare från backend.
   * 
   * Anropar GET /api/meetingtranscription/user/{userId}/recordings
   * och returnerar en lista med användarens alla inspelningar inklusive
   * metadata och koppling till ursprungliga bokningar.
   * 
   * Används av ProfilePageComponent för att visa inspelningshistorik-fliken.
   * 
   * @param userId Azure AD Object ID för användaren
   * @returns Observable med array av MeetingRecording objekt
   */
  getUserRecordings(userId: string): Observable<MeetingRecording[]> {
    const apiUrl = this.appConfig.apiUrl;
    return this.http.get<MeetingRecording[]>(`${apiUrl}/api/meetingtranscription/user/${userId}/recordings`);
  }

  /**
   * Hämtar en specifik transkribering för ett möte.
   * 
   * Anropar GET /api/meetingtranscription/meeting/{meetingId}/transcription
   * för att få detaljerad information om en specifik inspelning.
   * 
   * Kan användas för att ladda befintlig transkribering när användare
   * återvänder till ett mötesrum de tidigare spelat in.
   * 
   * @param meetingId ID för mötet/bokningen
   * @returns Observable med transkriberingsdata
   */
  getMeetingTranscription(meetingId: string): Observable<any> {
    const apiUrl = this.appConfig.apiUrl;
    return this.http.get(`${apiUrl}/api/meetingtranscription/meeting/${meetingId}/transcription`);
  }

  /**
   * Formaterar filstorlek från bytes till läsbar text.
   * 
   * Konverterar antal bytes till lämplig enhet (B, KB, MB, GB)
   * med två decimaler för att göra det användarvänligt.
   * 
   * Exempel:
   * - 1024 bytes → "1.00 KB"
   * - 2048576 bytes → "2.00 MB"
   * 
   * @param bytes Filstorlek i bytes
   * @returns Formaterad sträng med storlek och enhet
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Formaterar varaktighet från sekunder till läsbar mm:ss format.
   * 
   * Konverterar antal sekunder till minuter och sekunder format
   * för att visa inspelningens längd på ett användarvänligt sätt.
   * 
   * Exempel:
   * - 65 sekunder → "1:05"
   * - 3661 sekunder → "61:01"
   * 
   * @param seconds Varaktighet i sekunder
   * @returns Formaterad sträng i mm:ss format eller "Okänd längd" om 0
   */
  formatDuration(seconds: number): string {
    if (seconds === 0) return 'Okänd längd';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}