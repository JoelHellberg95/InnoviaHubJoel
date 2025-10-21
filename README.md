# InnoviaHub

Ett enkelt bokningssystem för resurser och faciliteter.

## Vad är InnoviaHub?

InnoviaHub är en webbapplikation där användare kan:

- Logga in säkert med Microsoft-konto
- Boka rum och resurser
- Se tillgängliga tider
- Hantera sina bokningar
- Transkribera inspelningar.

## Teknik

**Frontend (Webbsida):**

- Angular 19
- TypeScript
- Azure Entra ID för inloggning

**Backend (Server):**

- .NET 9.0
- ASP.NET Core API
- Entity Framework
- OpenAI API

## Kom igång

### Snabbstart

Om du inte vill installera applikationen själv finns produktionsmiljön tillgänglig på [Digital Ocean](https://innoviahub-app-6hrgl.ondigitalocean.app/).

### Entra ID

För att logga in, oavsett om det är lokalt eller i produktionsmiljön, behöver du bli tillagd i Innovia Hubs Entra ID-katalog. Kontakta någon i teamet för att bli tillagd.

### Vad du behöver installerat

- Node.js (version 18 eller senare)
- .NET 9.0 SDK
- Git

### Starta projektet

1. **Klona projektet:**

   ```bash
   git clone https://github.com/villetf/InnoviaHub.git
   cd InnoviaHub
   ```

2. **Starta backend (API):**

   ```bash
   cd backend
   dotnet run
   ```

   Servern startar på: <http://localhost:5184>

3. **Starta frontend (webbsida):**

   ```bash
   cd frontend
   npm install
   ng serve
   ```

   Webbsidan öppnas på: <http://localhost:4200>

## Hur man använder systemet

1. **Öppna webbläsaren** och gå till <http://localhost:4200>
2. **Klicka "Login with Microsoft"** för att logga in
3. **Välj datum** med datumväljaren
4. **Boka resurser** (kommer snart)
5. **Logga ut** när du är klar

## Meeting Room-funktion

Det finns en detaljerad funktionsbeskrivning för mötesrum i filen `MEETING_ROOM_FEATURE.md` i projektroten. Den innehåller krav, förslag på UI-flöde och eventuella API-endpoints för mötesrumsbokning och hantering.

Läs mer här: [Meeting Room Feature](MEETING_ROOM_FEATURE.md)

## Utveckling

### Mappar

- `backend/` - Server-kod (.NET)
- `frontend/` - Webbsida-kod (Angular)
- `README.md` - Den här filen

### Brancher

- `main` - Huvudbranch (stabil kod)
- `dev` - Utvecklingsbranch

### Testning

Det finns en debug-sida på <http://localhost:4200/azure-debug> för att testa Azure-inloggning.

## Problem?

Om något inte fungerar:

1. Kontrollera att Node.js och .NET är installerat
2. Kör `npm install` i frontend-mappen
3. Kör `dotnet restore` i backend-mappen
4. Starta om både frontend och backend

---

## Skapad av InnoviaHub-teamet

## IoT-integration

Den här applikationen kan integrera med ett lokalt IoT-backend för att visa sensorer och realtidsdata på sidan `/sensorer`.

Vad som implementerats:

- `IotService` i frontend ansvarar för att hämta tenant, lista enheter och ansluta till en SignalR-hub för realtidsmätningar.
- `DeviceListComponent` visar enhetskort med senaste mätvärden (temp, CO2, humidity).

Viktiga miljövariabler (läggs i `frontend/src/assets/env.js` eller via `scripts/generate-env.js`):

- `NG_APP_IOT_API_URL` — Bas-URL för IoT DeviceRegistry API (t.ex. `http://localhost:5101`).
- `NG_APP_IOT_HUB_URL` — Full URL till SignalR-hubben (t.ex. `http://localhost:5103/hub/telemetry`).
- `NG_APP_API_URL` och `NG_APP_HUB_URL` används som fallback om IoT-specifika variabler saknas.

SignalR-flöde (översikt):

1. Frontend ansluter till hubben (`NG_APP_IOT_HUB_URL`) och ger automatiskt reconnect.
2. Frontend anropar hub-metoden `JoinTenant('innovia')` för att gå med i tenant-specifika grupper.
3. Hubben skickar `measurementReceived`-event till klienten med payload `{ tenantSlug, deviceId, type, value, time }`.
4. `IotService` uppdaterar `devices$` och UI uppdateras.

Felsökningstips:

- Om frontend ser CORS-fel: kontrollera att IoT-backendens CORS tillåter `http://localhost:4200` (eller använd en dev-proxy i frontend).
- Kontrollera `assets/env.js` för korrekta URL:er och att du startat om `ng serve` efter ändring.
- Testa API med curl: `curl http://localhost:5101/api/tenants/by-slug/innovia` och `curl http://localhost:5101/api/tenants/<tenantId>/devices`.
- Testa SignalR negotiate (manuellt):
   `curl -i -X POST "http://localhost:5103/hub/telemetry/negotiate?negotiateVersion=1"`

Designnoteringar:

- Device-korten använder en heuristik på `model` för att avgöra vilka mätningar som ska visas (t.ex. om `model` innehåller "co2" eller "multi"). Detta kan bytas mot ett uttryckligt `capabilities`-fält från API:et om det finns.
- Data precision formateras i UI (temp 1 decimal, CO2 inga decimaler, humidity 1 decimal).
