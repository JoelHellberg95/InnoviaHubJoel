import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
    const aiApiUrl = this.appConfig.aiApiUrl;
    console.log('Using AI API URL for getUserRecordings:', aiApiUrl);
    return this.http.get<MeetingRecording[]>(`${aiApiUrl}/api/meetingtranscription/user/${userId}/recordings`);
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
    const aiApiUrl = this.appConfig.aiApiUrl;
    console.log('Using AI API URL for getMeetingTranscription:', aiApiUrl);
    return this.http.get(`${aiApiUrl}/api/meetingtranscription/meeting/${meetingId}/transcription`);
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

  /**
   * Sparar en transkribering lokalt i användarens localStorage.
   * 
   * Detta är en backup-lösning som sparar inspelningar lokalt i webbläsaren
   * så att de finns kvar även om server-sessionen försvinner.
   * 
   * @param recording MeetingRecording objekt att spara
   */
  saveRecordingLocally(recording: MeetingRecording): void {
    try {
      const userId = recording.userId;
      if (!userId) {
        console.warn('Kan inte spara inspelning lokalt: userId saknas');
        return;
      }
      
      const storageKey = `meeting_recordings_${userId}`;
      
      // Hämta befintliga inspelningar för användaren
      const existingRecordings = this.getLocalRecordings(userId);
      
      // Lägg till den nya inspelningen
      existingRecordings.push(recording);
      
      // Spara tillbaka till localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingRecordings));
      
      console.log('Inspelning sparad lokalt för användare:', userId);
    } catch (error) {
      console.error('Fel vid lokal sparning av inspelning:', error);
    }
  }

  /**
   * Hämtar alla lokalt sparade inspelningar för en användare.
   * 
   * @param userId Azure AD Object ID för användaren
   * @returns Array av lokalt sparade MeetingRecording objekt
   */
  getLocalRecordings(userId: string): MeetingRecording[] {
    try {
      const storageKey = `meeting_recordings_${userId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        return JSON.parse(stored) as MeetingRecording[];
      }
      return [];
    } catch (error) {
      console.error('Fel vid hämtning av lokala inspelningar:', error);
      return [];
    }
  }

  /**
   * Kombinerar server-inspelningar med lokalt sparade inspelningar.
   * 
   * Denna metod försöker först hämta från servern, och om det misslyckas
   * eller om servern inte har alla inspelningar, kombinerar den med lokala.
   * 
   * @param userId Azure AD Object ID för användaren
   * @returns Observable med kombinerade inspelningar
   */
  getAllRecordings(userId: string): Observable<MeetingRecording[]> {
    // Försök hämta från server först
    return this.getUserRecordings(userId).pipe(
      // Om server-anrop lyckas, kombinera med lokala inspelningar
      map(serverRecordings => {
        const localRecordings = this.getLocalRecordings(userId);
        
        // Kombinera och ta bort dubbletter baserat på ID eller timestamp
        const combined = [...serverRecordings];
        
        localRecordings.forEach(localRec => {
          const exists = combined.find(serverRec => 
            serverRec.id === localRec.id || 
            Math.abs(new Date(serverRec.createdAt).getTime() - new Date(localRec.createdAt).getTime()) < 1000
          );
          
          if (!exists) {
            combined.push(localRec);
          }
        });
        
        // Sortera efter datum (nyast först)
        return combined.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
      // Om server-anrop misslyckas, använd bara lokala inspelningar
      catchError(() => {
        console.log('Server otillgänglig, använder endast lokala inspelningar');
        return of(this.getLocalRecordings(userId));
      })
    );
  }

  /**
   * Raderar en lokal inspelning.
   * 
   * @param userId Azure AD Object ID för användaren
   * @param recordingId ID för inspelningen att radera
   */
  deleteLocalRecording(userId: string, recordingId: number): void {
    try {
      const recordings = this.getLocalRecordings(userId);
      const filtered = recordings.filter(rec => rec.id !== recordingId);
      
      const storageKey = `meeting_recordings_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      
      console.log('Lokal inspelning raderad:', recordingId);
    } catch (error) {
      console.error('Fel vid radering av lokal inspelning:', error);
    }
  }
}