# InnoviaHub Production Backend Integration

## Backend URL

**Production Backend**: `https://innoviahub.hellbergsystems.se:8004`

## Integration Guide

### 1. Local Development (använd din lokala backend)

```bash
# I frontend-mappen, skapa .env-fil
cd frontend
cp .env.example .env

# Redigera .env för local development:
NG_APP_API_URL=http://localhost:5184
NG_APP_HUB_URL=ws://localhost:5184/hubs/bookings
```

### 2. Vercel Production (använd Hellberg Systems backend)

När du deployar till Vercel, konfigurera dessa miljövariabler:

```bash
NG_APP_API_URL=https://innoviahub.hellbergsystems.se:8004
NG_APP_HUB_URL=wss://innoviahub.hellbergsystems.se:8004/hubs/bookings
NG_APP_LOGIN_REDIRECT_URL=https://your-vercel-domain.vercel.app/profil
NG_APP_LOGOUT_REDIRECT_URL=https://your-vercel-domain.vercel.app/logga-in
NG_APP_OPENAI_API_KEY=your-openai-api-key
```

### 3. CORS Configuration

Backend-URL:en är redan konfigurerad för CORS, men när du får din Vercel-domän:

1. Uppdatera `Program.cs` rad ~55:

```csharp
.WithOrigins(
   "http://localhost:4200",  // Local development
   "https://your-actual-vercel-domain.vercel.app"  // Din riktiga Vercel-domän
)
```

### 4. Test Integration

#### Lokal test mot production backend

```bash
# Tillfälligt, skapa .env med production backend
echo "NG_APP_API_URL=https://innoviahub.hellbergsystems.se:8004" > frontend/.env
echo "NG_APP_HUB_URL=wss://innoviahub.hellbergsystems.se:8004/hubs/bookings" >> frontend/.env

# Generera miljövariabler och starta
cd frontend
node scripts/generate-env.js
npm start
```

#### Produktionstest

Deploy till Vercel med miljövariablerna ovan.

## Viktiga Saker att Komma Ihåg

1. **CORS**: Hellberg Systems backend måste tillåta din Vercel-domän
2. **HTTPS**: Production backend använder HTTPS, så använd `wss://` för SignalR
3. **Certificates**: Ingen SSL-validering behövs för `hellbergsystems.se`
4. **API Keys**: OpenAI-nyckeln måste sättas i Vercel miljövariabler

## Next Steps

1. Få din Vercel-domän (efter första deploy)
2. Kontakta Hellberg Systems för att lägga till din domän i CORS
3. Konfigurera miljövariabler i Vercel dashboard
4. Testa att allt fungerar