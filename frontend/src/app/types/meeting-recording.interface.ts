/**
 * TypeScript interface för mötesinspeningar från backend API.
 * 
 * Denna interface definierar strukturen för data som kommer från
 * MeetingTranscriptionController och används av frontend-komponenter
 * för att visa inspelningshistorik och detaljer.
 * 
 * Matchar strukturen från backend MeetingRecording entity och API responses.
 */
export interface MeetingRecording {
  /** Unikt ID för inspelningen i databasen */
  id: number;
  
  /** ID för bokningen som inspelningen tillhör - används för navigation */
  bookingId: number;
  
  /** Azure AD Object ID för användaren som skapade inspelningen */
  userId?: string;
  
  /** Visningsnamn för användaren som skapade inspelningen */
  userName?: string;
  
  /** Originalfilnamn för den uppladdade ljudfilen */
  fileName: string;
  
  /** Filstorlek i bytes - visas formaterat för användaren */
  fileSizeBytes: number;
  
  /** 
   * Inspelningens längd i sekunder 
   * För närvarande alltid 0 eftersom vi inte analyserar ljudlängd än
   */
  durationSeconds: number;
  
  /** 
   * Fullständig AI-genererad transkribering av ljudfilen
   * Detta är huvudinnehållet som användare vill läsa
   */
  transcription: string;
  
  /** 
   * AI-genererad sammanfattning av mötets innehåll
   * Ger en snabb överblick utan att läsa hela transkriberingen
   */
  summary: string;
  
  /** 
   * Array av viktiga punkter/åtgärder från mötet
   * Backend sparar detta som semikolon-separerad sträng men API:et returnerar array
   */
  keyPoints: string[];
  
  /** 
   * Tidsstämpel när inspelningen skapades (ISO string format)
   * Används för sortering och visning av när inspelningen gjordes
   */
  createdAt: string;
  
  /** 
   * Information om den ursprungliga bokningen
   * Kan vara null om bokningen har raderats sedan inspelningen gjordes
   * Innehåller mötesrummets namn och tid för kontext
   */
  booking: {
    /** Namn på det bokade mötesrummet */
    resourceName: string;
    
    /** Mötets starttid (ISO string format) */
    startTime: string;
    
    /** Mötets sluttid (ISO string format) */
    endTime: string;
  } | null;
}