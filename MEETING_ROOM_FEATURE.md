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
  - Simulerar AI-transkribering (kan kopplas till OpenAI Whisper API)
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

- Simulerad transkribering med testdata
- Mockad OpenAI Whisper API-funktionalitet
- Strukturerat svar med transkribering, sammanfattning och åtgärdspunkter

### Framtida utbyggnad

- Integration med riktig OpenAI Whisper API
- Databaslagring av transkribering-resultat
- Realtidsstatus för transkribering
- Export-funktionalitet för resultat

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
3. **Ladda upp en ljudfil** (test med vilken .wav eller .mp3 fil som helst)
4. **Se transkribering-resultatet** med test-data

### Test-scenarion

- Filvalidering (fel format, för stor fil)
- Auktorisering (ej inloggad användare)
- Mötesstatus (före/under/efter mötet)
- Navigation mellan vyer

Vyn är nu fullt integrerad i systemet och redo för användning!
