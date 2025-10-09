using System.ComponentModel.DataAnnotations;

namespace backend.Models.Entities
{
    /// <summary>
    /// Entitet för att spara mötesinspeningar och AI-transkriberingar i databasen.
    /// Denna klass representerar en enskild ljudinspelning från ett mötesrum
    /// tillsammans med dess AI-genererade transkribering och metadata.
    /// </summary>
    public class MeetingRecording
    {
        /// <summary>
        /// Primärnyckel för inspelningen
        /// </summary>
        [Key]
        public int Id { get; set; }
        
        /// <summary>
        /// Referens till den bokning som inspelningen tillhör.
        /// Kopplar inspelningen till ett specifikt mötesrum och tidsslot.
        /// </summary>
        [Required]
        public int BookingId { get; set; }
        
        /// <summary>
        /// Azure AD Object ID (oid) för användaren som gjorde inspelningen.
        /// Används för säkerhet och åtkomstkontroll.
        /// </summary>
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        /// <summary>
        /// Visningsnamn för användaren från Azure AD.
        /// Sparas för att visa vem som gjorde inspelningen utan extra API-anrop.
        /// </summary>
        [Required]
        public string UserName { get; set; } = string.Empty;
        
        /// <summary>
        /// Originalfilnamn för den uppladdade ljudfilen.
        /// Behålls för användarens referens och felsökning.
        /// </summary>
        [Required]
        public string FileName { get; set; } = string.Empty;
        
        /// <summary>
        /// Filstorlek i bytes för den ursprungliga ljudfilen.
        /// Används för att visa metadata till användaren.
        /// </summary>
        public long FileSizeBytes { get; set; }
        
        /// <summary>
        /// Inspelningens längd i sekunder.
        /// För närvarande inte implementerat (alltid 0) men förberett för framtiden
        /// när vi lägger till verklig ljudanalys.
        /// </summary>
        public int DurationSeconds { get; set; }
        
        /// <summary>
        /// Fullständig AI-genererad transkribering av ljudfilen.
        /// Detta är huvudinnehållet som användare vill komma åt.
        /// </summary>
        [Required]
        public string Transcription { get; set; } = string.Empty;
        
        /// <summary>
        /// AI-genererad sammanfattning av mötet.
        /// Ger en kort överblick av mötets innehåll.
        /// </summary>
        public string? Summary { get; set; }
        
        /// <summary>
        /// Semikolon-separerad lista av viktiga punkter/åtgärder från mötet.
        /// Hjälper användare att snabbt identifiera actionable items.
        /// Format: "Punkt1;Punkt2;Punkt3"
        /// </summary>
        public string? KeyPoints { get; set; }
        
        /// <summary>
        /// Tidsstämpel när inspelningen skapades (UTC).
        /// Automatiskt satt när posten skapas.
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// Tidsstämpel när inspelningen senast uppdaterades (UTC).
        /// Uppdateras om transkriberingen skulle behöva redigeras.
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// Navigation property till den relaterade bokningen.
        /// Gör det möjligt att läsa in bokningsdetaljer via Entity Framework.
        /// Tillåter oss att visa mötesrummets namn och tid tillsammans med inspelningen.
        /// </summary>
        public virtual Booking? Booking { get; set; }
    }
}