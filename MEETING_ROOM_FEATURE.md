# Mötesrum-vy med AI-transkribering

## Översikt

En ny vy har skapats som användare kan nå när de har bokat ett mötesrum. Vyn innehåller funktionalitet för AI-transkribering enligt funktionskraven i `funktionskrav.md`.

## Nya komponenter

### Frontend

#### `meeting-room-page.component.ts/html/css`

- **Rutt**: `/motesrum/:id` (där `:id` är booking-ID)
- **Funktionalitet**:
  - Visar bokningsdetaljer (resurs, tid, status)
  - Ljud-uppladdning för AI-transkribering
  - Validering av filtyp (.wav, .mp3) och storlek (max 25MB)
  - Progress-bar under transkribering
  - Visa resultat: transkribering, sammanfattning, åtgärdspunkter
  - Navigation tillbaka till bokningar

#### Uppdaterade komponenter

- **`booking-confirmation-popup`**: Lagt till "Gå till mötesrum"-knapp efter lyckad bokning
- **`booking-list`**: Lagt till "Mötesrum"-knapp för aktuella/framtida bokningar
- **`bookingpage-list`**: Sparar och skickar booking-ID efter skapad bokning

### Backend

#### `MeetingTranscriptionController.cs`

- **Endpoint**: `POST /api/meetingtranscription/upload-and-transcribe`
  - Tar emot ljudfil, mötes-ID och användar-ID
  - Validerar filtyp och storlek
  - Kontrollerar användarauktorisering
  - Transkriberar ljudfilen
  - Returnerar transkribering, sammanfattning och åtgärdspunkter

- **Endpoint**: `GET /api/meetingtranscription/meeting/{meetingId}/transcription`
  - Hämtar tidigare transkribering för ett möte
  - Förberedd för framtida databasintegration

## Navigation

### Hur man når mötesrummet

1. **Efter bokning**: Klicka "Gå till mötesrum" i bekräftelse-popup
2. **Från profilsida**: Klicka "Mötesrum"-knappen bredvid aktiva bokningar
3. **Från admin-panel**: Klicka "Mötesrum"-knappen i bokningslistan
4. **Direkt URL**: `/motesrum/{booking-id}`

## Säkerhet

- Alla endpoints kräver inloggning (`[Authorize]`)
- Validering av filtyp och storlek
- Användar-ID verifieras mot Azure AD claims
- Endast .wav och .mp3 filer tillåtna (max 25MB)

## AI-integration

### Nuvarande implementation

- Integration med riktig OpenAI Whisper API
- Strukturerat svar med transkribering, sammanfattning och åtgärdspunkter
- Export-funktionalitet för resultat

### Framtida utbyggnad

- Databaslagring av transkribering-resultat
- Realtidsstatus för transkribering

## Tekniska detaljer

### Frontend dependencies

- Angular 19 standalone komponenter
- Angular Router för navigation
- TailwindCSS för styling
- Material Symbols för ikoner

### Backend dependencies

- ASP.NET Core 9
- Microsoft.AspNetCore.Authorization
- IFormFile för filuppladdning
- HttpClientFactory för OpenAI API-anrop

## Testning

### För att testa funktionaliteten

1. **Boka ett mötesrum** via `/boka`
2. **Klicka "Gå till mötesrum"** i bekräftelse-popup
3. **Ladda upp en ljudfil eller spela in en egen** (använd .wav eller .mp3 fil)
4. **Se transkribering-resultatet** (Du får en transribering direkt på sidan)

### Test-scenarion

- Filvalidering (fel format, för stor fil)
- Auktorisering (ej inloggad användare)
- Mötesstatus (före/under/efter mötet)
- Navigation mellan vyer

Vyn är nu fullt integrerad i systemet och redo för användning!
