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

## Bidra till projektet

1. Skapa en ny branch: `git checkout -b min-nya-feature`
2. Gör dina ändringar
3. Committa: `git commit -m "Lägg till min nya feature"`
4. Pusha: `git push origin min-nya-feature`
5. Skapa en Pull Request

---

## Skapad av InnoviaHub-teamet
