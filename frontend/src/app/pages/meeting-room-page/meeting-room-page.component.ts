import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { BookingService } from '../../components/ResourceMenu/Services/booking.service';
import { OpenAIService } from '../../services/openai.service';
import { AuthService } from '../../services/auth.service';
import { BookingRead } from '../../components/ResourceMenu/models/booking.model';

interface AudioUploadResult {
  success: boolean;
  message: string;
  transcription?: string;
  summary?: string;
  actionPoints?: string[];
}

interface AudioRecording {
  blob: Blob;
  duration: number;
  url: string;
}

@Component({
  selector: 'app-meeting-room-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-room-page.component.html',
  styleUrl: './meeting-room-page.component.css',
})
export class MeetingRoomPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);
  private openaiService = inject(OpenAIService);
  private authService = inject(AuthService);
  private msalService = inject(MsalService);
  private http = inject(HttpClient);

  // State
  booking: BookingRead | null = null;
  loading = false;
  error = '';
  
  // AI Transcription state
  isTranscribing = false;
  transcriptionResult: AudioUploadResult | null = null;
  selectedFile: File | null = null;
  uploadProgress = 0;

  // Audio Recording state
  isRecording = false;
  isPaused = false;
  recordingDuration = 0;
  recordingTimer: any = null;
  mediaRecorder: MediaRecorder | null = null;
  audioStream: MediaStream | null = null;
  recordedAudio: AudioRecording | null = null;
  audioChunks: Blob[] = [];

  // Meeting status
  meetingStarted = false;
  meetingEnded = false;
  
  // --- Kostnadsberäkning för transkribering ---
  uploadedFileDuration: number | null = null;

  ngOnInit() {
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (bookingId) {
      this.loadBooking(parseInt(bookingId));
    } else {
      this.error = 'Ingen bokning specificerad';
    }
  }

  private loadBooking(bookingId: number) {
    this.loading = true;
    this.bookingService.getById(bookingId).subscribe({
      next: (booking: BookingRead) => {
        this.booking = booking;
        this.loading = false;
        
        // Kontrollera om mötet är aktivt
        const now = new Date();
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        
        this.meetingStarted = now >= start;
        this.meetingEnded = now > end;
      },
      error: (err: any) => {
        this.error = 'Kunde inte ladda bokningsdetaljerna';
        this.loading = false;
        console.error('Error loading booking:', err);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (webm, wav, mp3, mpeg only)
      const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'Endast .webm, .wav och .mp3 filer är tillåtna';
        return;
      }
      // Validate file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        this.error = 'Filen är för stor. Max 25MB tillåtet.';
        return;
      }
      this.selectedFile = file;
      this.error = '';
      // Extract duration from uploaded file
      this.uploadedFileDuration = null;
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        this.uploadedFileDuration = Math.round(audio.duration);
      };
      audio.src = URL.createObjectURL(file);
    }
  }

  async uploadAndTranscribe() {
    if (!this.selectedFile || !this.booking) return;

    this.isTranscribing = true;
    this.transcriptionResult = null;
    this.error = '';
    this.uploadProgress = 0;

    try {
      // Skip authentication since backend has AllowAnonymous for testing
      const formData = new FormData();
      formData.append('audioFile', this.selectedFile);
      formData.append('meetingId', this.booking.id.toString());
      formData.append('userId', this.authService.getUserId() || '12345678-1234-1234-1234-123456789012'); // Use valid GUID format

      // Use HttpClient with progress reporting
      this.uploadProgress = 0;
      const apiUrl = (window as any).__env?.NG_APP_API_URL || '';
      const url = `${apiUrl}/api/meetingtranscription/upload-and-transcribe`;

      this.http.post(url, formData, {
        reportProgress: true,
        observe: 'events'
      }).subscribe({
        next: (event: any) => {
          // Handle progress events
          if (event.type === 1 && event.total) { // HttpEventType.UploadProgress === 1
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          } else if (event.type === 4) { // HttpEventType.Response === 4
            const body = event.body;
            if (body && body.success) {
              this.transcriptionResult = {
                success: true,
                message: body.message || 'Transkribering slutförd',
                transcription: body.transcription,
                summary: body.summary,
                actionPoints: body.actionPoints || []
              };
            } else {
              this.transcriptionResult = {
                success: false,
                message: body?.message || 'Okänt svar från servern'
              };
            }
            this.uploadProgress = 100;
          }
        },
        error: (err: any) => {
          console.error('Transcription upload error - Full error object:', err);
          console.error('Error status:', err.status);
          console.error('Error response text:', err.error);
          if (typeof err.error === 'string') {
            console.error('Raw error text:', err.error);
          }
          this.transcriptionResult = { success: false, message: err?.error?.message || err.message || 'Fel vid uppladdning' };
          this.uploadProgress = 0;
        },
        complete: () => {
          this.isTranscribing = false;
          // Reset selected file to avoid accidental re-uploads
          this.selectedFile = null;
        }
      });

    } catch (error) {
      console.error('Transcription error:', error);
      this.transcriptionResult = {
        success: false,
        message: 'Fel vid transkribering: ' + (error as any).message
      };
    } finally {
      this.isTranscribing = false;
      this.uploadProgress = 0;
    }
  }

  async startRecording() {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      this.recordingDuration = 0;
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.recordedAudio = {
          blob: audioBlob,
          duration: this.recordingDuration,
          url: audioUrl
        };
        
        this.stopRecordingTimer();
        this.cleanupStream();
      };
      
      this.mediaRecorder.start(1000); // Samla data varje sekund
      this.isRecording = true;
      this.startRecordingTimer();
      
    } catch (error) {
      console.error('Fel vid start av inspelning:', error);
      this.error = 'Kunde inte komma åt mikrofonen. Kontrollera att du har gett tillstånd.';
    }
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.stopRecordingTimer();
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.startRecordingTimer();
    }
  }

  stopRecording() {
    if (this.mediaRecorder && (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.isPaused = false;
    }
  }

  private startRecordingTimer() {
    this.recordingTimer = setInterval(() => {
      this.recordingDuration++;
    }, 1000);
  }

  private stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  private cleanupStream() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  useRecordedAudio() {
    if (this.recordedAudio) {
      // Konvertera Blob till File för att använda med befintlig uppladdningsfunktion
      const file = new File([this.recordedAudio.blob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      this.selectedFile = file;
      this.recordedAudio = null; // Rensa inspelningen
    }
  }

  discardRecording() {
    if (this.recordedAudio) {
      URL.revokeObjectURL(this.recordedAudio.url);
      this.recordedAudio = null;
    }
  }

  goBackToBookings() {
    this.router.navigate(['/profil']);
  }

  endMeeting() {
    this.meetingEnded = true;
    // Stoppa eventuell pågående inspelning
    if (this.isRecording) {
      this.stopRecording();
    }
    this.cleanupStream();
  }

  get canUploadAudio(): boolean {
    return this.meetingStarted && !this.isTranscribing && !this.isRecording;
  }

  get canRecord(): boolean {
    return this.meetingStarted && !this.isTranscribing && !this.recordedAudio;
  }

  get recordingTimeFormatted(): string {
    const minutes = Math.floor(this.recordingDuration / 60);
    const seconds = this.recordingDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // --- Joel's ändringar: Kostnadsberäkning för transkribering ---
  calculateTranscriptionCost(): string {
    // Only calculate cost if we have a valid audio duration
    let duration = 0;
    if (this.transcriptionResult) {
      if (this.recordedAudio && this.recordedAudio.duration > 0) {
        duration = this.recordedAudio.duration;
      } else if (this.uploadedFileDuration && this.uploadedFileDuration > 0) {
        duration = this.uploadedFileDuration;
      }
    }
    if (duration > 0) {
      const cost = duration * 0.015;
      return cost.toFixed(2);
    }
    return '-';
  }

  ngOnDestroy() {
    // Stoppa inspelning och rensa resurser
    if (this.isRecording) {
      this.stopRecording();
    }
    this.stopRecordingTimer();
    this.cleanupStream();
    
    // Rensa eventuella object URLs
    if (this.recordedAudio) {
      URL.revokeObjectURL(this.recordedAudio.url);
    }
  }

  get meetingStatus(): string {
    if (!this.booking) return '';
    
    const now = new Date();
    const start = new Date(this.booking.startTime);
    const end = new Date(this.booking.endTime);
    
    if (now < start) return 'Mötet har inte startat ännu';
    if (now > end) return 'Mötet har avslutats';
    return 'Mötet pågår';
  }

  get meetingTimeInfo(): string {
    if (!this.booking) return '';
    
    const start = new Date(this.booking.startTime);
    const end = new Date(this.booking.endTime);
    
    return `${start.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${end.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }

  // --- Joel's ändringar: Ladda ner transkribering som textfil ---
  downloadTranscriptionText() {
    if (!this.transcriptionResult?.transcription) return;
    const text = this.transcriptionResult.transcription;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transkribering.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}