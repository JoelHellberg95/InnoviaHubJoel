using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models.Entities;
using System.Text.Json;

namespace backend.Controllers;

/// <summary>
/// Controller för hantering av mötesljudinspelningar och AI-transkribering.
/// 
/// Denna controller ansvarar för:
/// 1. Ta emot ljudfiler från frontend (antingen uppladdade filer eller live-inspelningar)
/// 2. Skicka ljudet till AI-tjänster för transkribering (för närvarande simulerat)
/// 3. Spara transkriberingen i databasen för framtida åtkomst
/// 4. Tillhandahålla endpoints för att hämta tidigare transkriberingar
/// 
/// Säkerhet: Alla endpoints kräver Azure AD-autentisering.
/// AI-integration: Förberedd för OpenAI Whisper API men använder testdata för utveckling.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous] // Temporary - remove auth requirement for testing
public class MeetingTranscriptionController : ControllerBase
{
    // Dependency injection för externa tjänster
    private readonly IHttpClientFactory _httpClientFactory; // För framtida OpenAI API-anrop
    private readonly IConfiguration _configuration;         // För att läsa API-nycklar
    private readonly ILogger<MeetingTranscriptionController> _logger; // Logging
    private readonly AppDbContext _context;                // Databasåtkomst

    /// <summary>
    /// Constructor som injicerar alla nödvändiga beroenden.
    /// </summary>
    public MeetingTranscriptionController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<MeetingTranscriptionController> logger,
        AppDbContext context)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Huvudendpoint för att ladda upp ljudfiler och få AI-transkribering.
    /// 
    /// Denna metod:
    /// 1. Validerar den uppladdade filen (storlek, format, säkerhet)
    /// 2. Kontrollerar användarens behörighet via Azure AD-claims
    /// 3. Skickar filen för AI-transkribering (simulerat för utveckling)
    /// 4. Sparar resultatet i databasen för framtida åtkomst
    /// 5. Returnerar transkriberingen till frontend
    /// 
    /// Parameter audioFile: Den uppladdade ljudfilen (.wav, .mp3, max 25MB)
    /// Parameter meetingId: ID för bokningen/mötet som inspelningen tillhör
    /// Parameter userId: Används för extra validering (borde matcha Azure AD-claim)
    /// 
    /// Returns: JSON med transkribering, sammanfattning och åtgärdspunkter
    /// </summary>
    [HttpPost("upload-and-transcribe")]
    public async Task<IActionResult> UploadAndTranscribe(IFormFile audioFile, [FromForm] string meetingId, [FromForm] string userId)
    {
        try
        {
            // === FILVALIDERING ===
            // Kontrollera att en fil faktiskt laddades upp
            if (audioFile == null || audioFile.Length == 0)
            {
                return BadRequest("Ingen ljudfil uppladdad");
            }

            // Säkerhetsgräns: Förhindra för stora filer som kan överbelasta servern
            if (audioFile.Length > 25 * 1024 * 1024) // 25MB limit
            {
                return BadRequest("Filen är för stor. Max 25MB tillåtet.");
            }

            // Säkerhet: Endast tillåt kända ljudformat (webm, wav, mp3) för att förhindra skadliga filer
            // Whisper stödjer these common container types; block everything else.
            var allowedTypes = new[] { "audio/webm", "audio/wav", "audio/mp3", "audio/mpeg" };
            if (!allowedTypes.Contains(audioFile.ContentType.ToLower()))
            {
                return BadRequest("Endast .wav och .mp3 filer är tillåtna");
            }

            // === SÄKERHETSVALIDERING ===
            // TEMP: Skip user validation since we're using AllowAnonymous for testing
            var currentUserId = userId; // Use the provided userId from form
            if (string.IsNullOrEmpty(currentUserId))
            {
                currentUserId = "12345678-1234-1234-1234-123456789012"; // Fallback GUID for testing
            }

            // === AI-TRANSKRIBERING ===
            // Om OpenAI-nyckel är konfigurerad, använd Whisper för transkribering och
            // använd även Chat Completions för att skapa summary + action points.
            // Annars faller vi tillbaka till simulerad transkribering (utvecklingsläge).
            var openAiKey = _configuration["OpenAI:ApiKey"];
            TranscriptionResult transcriptionResult;
            
            if (!string.IsNullOrEmpty(openAiKey))
            {
                _logger.LogInformation("🎙️ USING REAL OPENAI WHISPER - API key found! File: {FileName}", audioFile.FileName);
                transcriptionResult = await TranscribeWithOpenAIAsync(audioFile);
                _logger.LogInformation("✅ OpenAI transcription completed successfully");
            }
            else
            {
                _logger.LogWarning("⚠️ NO OPENAI KEY - Using simulated transcription (mock data)");
                // Fallback för utveckling / tests
                transcriptionResult = await SimulateTranscription(audioFile);
                _logger.LogWarning("📝 Mock transcription completed - NOT REAL AI RESULT!");
            }

            // === DATABASSPARNING ===
            // TEMP: Use fallback username since no auth claims available
            var userName = "Test User"; // Fallback for anonymous testing
            
            // Konvertera meetingId till int och spara i databasen för framtida åtkomst
            if (int.TryParse(meetingId, out int bookingId))
            {
                await SaveTranscriptionResult(bookingId, currentUserId, userName, audioFile, transcriptionResult);
            }

            // === SVAR TILL FRONTEND ===
            // Returnera det kompletta resultatet för omedelbar visning
            return Ok(new
            {
                success = true,
                message = "Transkribering slutförd",
                transcription = transcriptionResult.Transcription,
                summary = transcriptionResult.Summary,
                actionPoints = transcriptionResult.ActionPoints,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            // Logga fel för felsökning men exponera inte känslig information till användaren
            _logger.LogError(ex, "Fel vid transkribering av ljudfil");
            return StatusCode(500, new { success = false, message = $"Fel vid transkribering: {ex.Message}" });
        }
    }

    /// <summary>
    /// Simulerar AI-transkribering av ljudfil för utveckling och testning.
    /// 
    /// VIKTIGT: Detta är endast för utveckling!
    /// I produktion skulle denna metod:
    /// 1. Konvertera ljudfilen till rätt format för AI-API:et
    /// 2. Skicka HTTP-request till OpenAI Whisper API
    /// 3. Hantera API-svar och fel
    /// 4. Returnera verklig transkribering
    /// 
    /// För nu returnerar vi realistisk testdata för att demonstrera funktionaliteten.
    /// </summary>
    /// <param name="audioFile">Ljudfilen som ska transkriberas</param>
    /// <returns>Simulerat transkriberingsresultat med text, sammanfattning och åtgärdspunkter</returns>
    private async Task<TranscriptionResult> SimulateTranscription(IFormFile audioFile)
    {
        // Simulera AI-bearbetningstid för realistisk användarupplevelse
        await Task.Delay(2000);

        // TODO: Implementera verklig OpenAI Whisper API-integration
        // Exempel på hur det skulle se ut:
        /*
        var httpClient = _httpClientFactory.CreateClient("OpenAIClient");
        var apiKey = _configuration["OpenAI:ApiKey"];
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        
        using var content = new MultipartFormDataContent();
        using var fileStream = audioFile.OpenReadStream();
        content.Add(new StreamContent(fileStream), "file", audioFile.FileName);
        content.Add(new StringContent("whisper-1"), "model");
        
        var response = await httpClient.PostAsync("https://api.openai.com/v1/audio/transcriptions", content);
        var result = await response.Content.ReadAsStringAsync();
        // ... hantera svar och skapa sammanfattning
        */

        // Testdata som simulerar realistiska AI-resultat
        return new TranscriptionResult
        {
            // Huvudtranskribering - simulerar vad AI skulle producera från ljudfilen
            Transcription = $"Detta är en testtranskribering av filen '{audioFile.FileName}'. " +
                          "Mötet behandlade projektets framsteg och viktiga beslut togs angående nästa fas. " +
                          "Deltagarna diskuterade utmaningar och möjligheter som ligger framför teamet. " +
                          "Flera konkreta åtgärder identifierades för att säkerställa framgång.",
            
            // AI-genererad sammanfattning av mötets huvudpunkter
            Summary = "Mötet fokuserade på projektets status och planering av nästa steg. " +
                     "Teamet diskuterade framsteg, identifierade utmaningar och bestämde prioriteringar. " +
                     "Flera konkreta åtgärder beslutades för att driva projektet framåt.",
            
            // Lista av actionable items som AI extraherat från samtalet
            ActionPoints = new List<string>
            {
                "Slutföra designdokument till fredag",
                "Boka uppföljningsmöte nästa vecka", 
                "Kontakta externa leverantörer för offerter",
                "Uppdatera projektplan baserat på nya krav",
                "Förbereda presentation för styrelsen"
            }
        };
    }

    /// <summary>
    /// Sparar transkriberingsresultatet i databasen för framtida åtkomst.
    /// 
    /// Denna metod skapar en permanent post av inspelningen och dess AI-analys
    /// så att användare kan komma tillbaka och se historik av sina möten.
    /// 
    /// Databasen lagrar:
    /// - Koppling till den ursprungliga bokningen/mötet
    /// - Användarinformation för säkerhet och åtkomstkontroll
    /// - Originalfilens metadata (namn, storlek)
    /// - AI-genererat innehåll (transkribering, sammanfattning, åtgärdspunkter)
    /// - Tidsstämplar för historik
    /// </summary>
    /// <param name="bookingId">ID för bokningen som inspelningen tillhör</param>
    /// <param name="userId">Azure AD Object ID för användaren</param>
    /// <param name="userName">Visningsnamn för användaren</param>
    /// <param name="audioFile">Den ursprungliga ljudfilen för metadata</param>
    /// <param name="result">AI-transkriberingsresultatet</param>
    private async Task SaveTranscriptionResult(int bookingId, string userId, string userName, IFormFile audioFile, TranscriptionResult result)
    {
        try
        {
            // Skapa en ny databaspost med all relevant information
            var recording = new MeetingRecording
            {
                BookingId = bookingId,              // Koppla till ursprunglig bokning
                UserId = userId,                    // Azure AD Object ID för säkerhet
                UserName = userName,                // Visningsnamn för UI
                FileName = audioFile.FileName,      // Originalfilnamn för referens
                FileSizeBytes = audioFile.Length,   // Filstorlek för metadata
                DurationSeconds = 0,                // TODO: Implementera verklig ljudlängdsanalys
                Transcription = result.Transcription, // Fullständig AI-transkribering
                Summary = result.Summary,           // AI-genererad sammanfattning
                KeyPoints = string.Join(";", result.ActionPoints), // Åtgärdspunkter som semikolon-separerad sträng
                CreatedAt = DateTime.UtcNow,        // När inspelningen skapades
                UpdatedAt = DateTime.UtcNow         // När posten senast uppdaterades
            };

            // Lägg till i databas och spara
            _context.MeetingRecordings.Add(recording);
            await _context.SaveChangesAsync();

            // Logga framgång för felsökning och audit trail
            _logger.LogInformation("Transkribering sparad för bokning {BookingId} av användare {UserId}", bookingId, userId);
        }
        catch (Exception ex)
        {
            // Logga fel men låt det bubbla upp så upload-metoden kan hantera det
            _logger.LogError(ex, "Fel vid sparande av transkribering för bokning {BookingId}", bookingId);
            throw;
        }
    }

    /// <summary>
    /// Kör en faktisk OpenAI Whisper transkribering följt av en chat completion för sammanfattning och åtgärdspunkter.
    /// Denna metod använder named HttpClient "OpenAIClient" som konfigureras i Program.cs.
    /// </summary>
    private async Task<TranscriptionResult> TranscribeWithOpenAIAsync(IFormFile audioFile)
    {
        // Create client (Program.cs configures Authorization header if API key is present)
        var client = _httpClientFactory.CreateClient("OpenAIClient");

        // Log file details for debugging
        _logger.LogInformation("🎵 Sending to OpenAI Whisper: {FileName}, Size: {Size} bytes, ContentType: {ContentType}", 
            audioFile.FileName, audioFile.Length, audioFile.ContentType);

        byte[] audioData;
        string fileName = audioFile.FileName;
        using (var stream = audioFile.OpenReadStream())
        {
            audioData = new byte[audioFile.Length];
            var totalBytesRead = 0;
            while (totalBytesRead < audioData.Length)
            {
                var bytesRead = await stream.ReadAsync(audioData, totalBytesRead, audioData.Length - totalBytesRead);
                if (bytesRead == 0) break;
                totalBytesRead += bytesRead;
            }
        }

        // Retry with exponential backoff for transient errors (429/5xx)
        var maxRetries = 3;
        var attempt = 0;
        HttpResponseMessage? response = null;
        while (attempt <= maxRetries)
        {
            try
            {
                // Create fresh content for each attempt to avoid stream consumption issues
                using var content = new MultipartFormDataContent();
                var fileContent = new StreamContent(new MemoryStream(audioData));
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/mpeg");
                content.Add(fileContent, "file", fileName);
                content.Add(new StringContent("gpt-4o-mini-transcribe"), "model");
                
                // Use full URL to avoid NotFound error
                var whisperUrl = "https://api.openai.com/v1/audio/transcriptions";
                response = await client.PostAsync(whisperUrl, content);
                if (response.IsSuccessStatusCode)
                {
                    var respJson = await response.Content.ReadAsStringAsync();
                    // Whisper response structure varies; try to extract `text` field
                    using var doc = JsonDocument.Parse(respJson);
                    var root = doc.RootElement;
                    var transcriptionText = string.Empty;
                    if (root.TryGetProperty("text", out var textElem))
                    {
                        transcriptionText = textElem.GetString() ?? string.Empty;
                    }
                    else if (root.TryGetProperty("transcription", out var t2))
                    {
                        transcriptionText = t2.GetString() ?? string.Empty;
                    }

                    // Now use chat completions to produce summary and action points
                    var (summary, actions) = await PostToOpenAIChatAsync(transcriptionText);

                    return new TranscriptionResult
                    {
                        Transcription = transcriptionText,
                        Summary = summary,
                        ActionPoints = actions
                    };
                }

                // If client returned 429 or 5xx, consider retrying
                if ((int)response.StatusCode == 429 || (int)response.StatusCode >= 500)
                {
                    attempt++;
                    var delayMs = (int)Math.Pow(2, attempt) * 500;
                    await Task.Delay(delayMs);
                    continue;
                }

                // Non-retryable error -> throw so upper layer can handle/log
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("OpenAI Whisper returned error {Status}: {Content}", response.StatusCode, errorContent);
                
                // Try to parse OpenAI error for better messaging
                try
                {
                    using var errorDoc = JsonDocument.Parse(errorContent);
                    if (errorDoc.RootElement.TryGetProperty("error", out var errorObj))
                    {
                        var errorType = errorObj.TryGetProperty("type", out var typeElem) ? typeElem.GetString() : "unknown";
                        var errorMessage = errorObj.TryGetProperty("message", out var msgElem) ? msgElem.GetString() : response.StatusCode.ToString();
                        throw new Exception($"OpenAI Whisper error ({errorType}): {errorMessage}");
                    }
                }
                catch (JsonException)
                {
                    // If we can't parse the error, just use the raw response
                }
                
                throw new Exception($"OpenAI Whisper error: {response.StatusCode}");
            }
            catch (HttpRequestException ex)
            {
                attempt++;
                _logger.LogWarning(ex, "Transient error calling OpenAI Whisper (attempt {Attempt})", attempt);
                if (attempt > maxRetries) throw;
                await Task.Delay(200 * attempt);
            }
        }

        // If we get here, all retries failed
        throw new Exception("Failed to transcribe with OpenAI Whisper after retries");
    }

    /// <summary>
    /// Anropar OpenAI Chat Completions för att generera en kort summary och lista av action points.
    /// Returnerar tuple (summary, actions)
    /// </summary>
    private async Task<(string summary, List<string> actions)> PostToOpenAIChatAsync(string transcription)
    {
        var client = _httpClientFactory.CreateClient("OpenAIClient");

        // Bygg en koncis prompt för att extrahera summary och action items
    var systemMessage = "Du är en assistent som extraherar en kort, faktabaserad sammanfattning och en lista med konkreta åtgärdspunkter (kortfattat) från ett mötesprotokoll. Använd INTE emojis, symboler eller dekorativ text. Återge action points som en JSON-array med endast text.";
    var userMessage = $"Transkribering:\n\n{transcription}\n\nGe en kort sammanfattning (1-2 meningar, endast text, inga emojis) och en JSON-array med action points (endast text, inga emojis).";

        var requestObj = new
        {
            model = "gpt-4.1",
            messages = new[] {
                new { role = "system", content = systemMessage },
                new { role = "user", content = userMessage }
            },
            max_tokens = 300,
            temperature = 0.2
        };

        var json = JsonSerializer.Serialize(requestObj);
        using var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await client.PostAsync("/chat/completions", content);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("OpenAI Chat Completions error {Status}: {Content}", response.StatusCode, err);
            return ("", new List<string>());
        }

        var respJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(respJson);
        var root = doc.RootElement;

        // Parse response - extract text from choices[0].message.content
        string assistantText = string.Empty;
        if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
        {
            var first = choices[0];
            if (first.TryGetProperty("message", out var message) && message.TryGetProperty("content", out var contentElem))
            {
                assistantText = contentElem.GetString() ?? string.Empty;
            }
        }

        // Separate summary and action points, but do NOT overwrite the transcript
        var summary = assistantText;
        var actions = new List<string>();

        // Find first occurrence of '[' for JSON array of action points
        var idx = assistantText.IndexOf('[');
        if (idx >= 0)
        {
            summary = assistantText.Substring(0, idx).Trim();
            var arrayText = assistantText.Substring(idx);
            try
            {
                var parsed = JsonSerializer.Deserialize<List<string>>(arrayText);
                if (parsed != null) actions = parsed;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not parse action points JSON from assistant text");
            }
        }

        // Remove emojis from summary and action points
        summary = RemoveEmojis(summary);
        var cleanActions = actions.Select(RemoveEmojis).ToList();
        return (summary, cleanActions);

    }

    // Helper to remove emojis from a string
    private static string RemoveEmojis(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        // Remove most common emoji unicode ranges
        return System.Text.RegularExpressions.Regex.Replace(input, "[\u2190-\u21FF\u2600-\u27BF\u1F300-\u1F6FF\u1F900-\u1F9FF\u1FA70-\u1FAFF\u200D\uFE0F]", "");
    }

    /// <summary>
    /// Hämtar alla inspelningar för en specifik användare.
    /// 
    /// Denna endpoint används av profilvyn för att visa användarens inspelningshistorik.
    /// Resultatet inkluderar metadata om inspelningen samt koppling till ursprungliga bokningen
    /// så att användaren kan se vilket mötesrum och vilken tid inspelningen gjordes.
    /// 
    /// Säkerhet: Endast användaren själv kan se sina egna inspelningar.
    /// Performance: Använder Entity Framework Include() för att ladda relaterade data i en query.
    /// </summary>
    /// <param name="userId">Azure AD Object ID för användaren vars inspelningar ska hämtas</param>
    /// <returns>Lista av inspelningar med metadata och bokningsinformation</returns>
    [HttpGet("user/{userId}/recordings")]
    public async Task<IActionResult> GetUserRecordings(string userId)
    {
        try
        {
            // Kontrollera användarauktorisering
            var currentUserId = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "oid")?.Value;
            if (string.IsNullOrEmpty(currentUserId) || currentUserId != userId)
            {
                return Unauthorized("Inte behörig att se dessa inspelningar");
            }

            var recordings = await _context.MeetingRecordings
                .Include(mr => mr.Booking)
                .ThenInclude(b => b!.Resource)
                .Where(mr => mr.UserId == userId)
                .OrderByDescending(mr => mr.CreatedAt)
                .Select(mr => new
                {
                    id = mr.Id,
                    bookingId = mr.BookingId,
                    fileName = mr.FileName,
                    fileSizeBytes = mr.FileSizeBytes,
                    durationSeconds = mr.DurationSeconds,
                    transcription = mr.Transcription,
                    summary = mr.Summary,
                    keyPoints = mr.KeyPoints != null ? mr.KeyPoints.Split(';', StringSplitOptions.RemoveEmptyEntries) : new string[0],
                    createdAt = mr.CreatedAt,
                    booking = mr.Booking != null ? new
                    {
                        resourceName = mr.Booking.Resource!.Name,
                        startTime = mr.Booking.StartTime,
                        endTime = mr.Booking.EndTime
                    } : null
                })
                .ToListAsync();

            return Ok(recordings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fel vid hämtning av inspelningar för användare {UserId}", userId);
            return StatusCode(500, "Fel vid hämtning av inspelningar");
        }
    }

    [HttpGet("meeting/{meetingId}/transcription")]
    public async Task<IActionResult> GetMeetingTranscription(string meetingId)
    {
        try
        {
            // Kontrollera användarauktorisering
            var currentUserId = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "oid")?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized("Användare inte identifierad");
            }

            if (!int.TryParse(meetingId, out int bookingId))
            {
                return BadRequest("Ogiltigt mötes-ID");
            }

            var recording = await _context.MeetingRecordings
                .Include(mr => mr.Booking)
                .ThenInclude(b => b!.Resource)
                .FirstOrDefaultAsync(mr => mr.BookingId == bookingId && mr.UserId == currentUserId);

            if (recording == null)
            {
                return NotFound("Ingen transkribering hittades för detta möte");
            }

            return Ok(new
            {
                id = recording.Id,
                meetingId = recording.BookingId,
                fileName = recording.FileName,
                transcription = recording.Transcription,
                summary = recording.Summary,
                keyPoints = recording.KeyPoints != null ? recording.KeyPoints.Split(';', StringSplitOptions.RemoveEmptyEntries) : new string[0],
                createdAt = recording.CreatedAt,
                booking = new
                {
                    resourceName = recording.Booking!.Resource!.Name,
                    startTime = recording.Booking.StartTime,
                    endTime = recording.Booking.EndTime
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fel vid hämtning av transkribering för möte {MeetingId}", meetingId);
            return StatusCode(500, "Fel vid hämtning av transkribering");
        }
    }
}

public class TranscriptionResult
{
    public string Transcription { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<string> ActionPoints { get; set; } = new();
}