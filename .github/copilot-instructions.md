# InnoviaHub AI Coding Instructions

## Project Overview
InnoviaHub is a resource booking system with a .NET 9 backend and Angular 19 frontend, using Azure Entra ID for authentication and real-time updates via SignalR.

## Architecture & Key Components

### Backend (.NET 9 API)
- **Authentication**: Azure Entra ID with JWT Bearer tokens. All user context comes from Azure AD claims (`oid` for UserId, display name for UserName)
- **Database**: MySQL with Entity Framework (configurable to in-memory via `useInMemory` flag in `Program.cs`)
- **Real-time**: SignalR hub at `/hubs/bookings` for live booking updates
- **CORS**: Configured for `http://localhost:4200` and production API `https://innoviahub.hellbergsystems.se:8004` (prepare for Vercel frontend deployment)
- **OpenAI**: API key configured in `appsettings.json` under `OpenAI` section

### Frontend (Angular 19)
- **Authentication**: `@azure/msal-angular` with popup/redirect flows
- **Environment Config**: Dynamic via `scripts/generate-env.js` → `assets/env.js` → `window.__env`
- **State Management**: Services with RxJS, no NgRx
- **Styling**: TailwindCSS with Angular Material components
- **OpenAI**: API key available via `AppConfigService.openaiApiKey`, service available at `services/openai.service.ts`

## Critical Development Patterns

### Authentication Flow
1. Frontend: MSAL handles token acquisition/refresh
2. Backend: `[AllowAnonymous]` currently used for testing - replace with proper authorization attributes
3. User identification: Use `HttpContext.User.Claims` to get Azure AD `oid` and `name`

### Environment Configuration
```javascript
// Always run before serving frontend
node scripts/generate-env.js
```
This creates `assets/env.js` loaded by `index.html` to configure API endpoints dynamically.

### Database Patterns
- Repository pattern: `IBookingRepository` → `BookingRepository`
- Entities in `Models/Entities/` with navigation properties
- DTOs for API contracts (e.g., `BookingReadDto`, `BookingCreateDto`)
- EF migrations in `Migrations/` folder

### Component Structure
- **Pages**: Route-level components in `pages/` (e.g., `booking-page`, `admin-page`)
- **Components**: Reusable UI in `components/` with feature-based folders
- **Services**: Business logic in `services/` (e.g., `auth.service.ts`)
- **Guards**: Route protection via `authGuard.ts`, `roleGuard.ts`

## Essential Commands

### Development Startup
```bash
# Backend
cd backend && dotnet run

# Frontend (separate terminal)
cd frontend
node scripts/generate-env.js  # Generate environment config
npm start  # or ng serve
```

### Database Management
```bash
# Add migration
cd backend && dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

### Testing & Debugging
- Backend API: Use `backend.http` or `BookingTests.rest` files
- Frontend auth: Debug page at `/azure-debug`
- SignalR: Test hub connection at `ws://localhost:5184/hubs/bookings`

## Key Integration Points

### Azure AD Configuration
- **Backend**: `appsettings.json` → `AzureAd` section with TenantId/ClientId
- **Frontend**: `auth-config.ts` → `msalConfig` with matching tenant/client IDs
- **User Context**: Backend extracts `oid` claim for `UserId`, `name` for display

### API Communication
- Base URL via `AppConfigService.apiUrl` (from `window.__env`)
- MSAL interceptor auto-adds Bearer tokens
- CORS policy named "ng" in backend `Program.cs`

### Real-time Updates
- SignalR hub: `BookingHub` (currently empty, extend for live booking notifications)
- Frontend: Connect via `@microsoft/signalr` to hub URL from config

### OpenAI Integration
- **Backend**: API key in `appsettings.json` → `OpenAI` section with ApiKey, BaseUrl, DefaultModel
- **Frontend**: API key via `AppConfigService.openaiApiKey` from environment config
- **Service**: `OpenAIService` provides `createCompletion()` and `simpleCompletion()` methods
- **Usage**: Access via dependency injection, automatically includes Bearer token authentication
- **Security**: API keys stored in environment variables only - never commit to Git!

## Code Conventions

### C# Backend
- Controllers: `[Route("api/[controller]")]` pattern
- DTOs: Separate read/create/update DTOs for clean API contracts
- Comments: Swedish comments with "Joel's ändringar" prefix for custom modifications
- Authorization: Use policy-based authorization (`AdminOnly`, `UserOrAdmin`, `AuthenticatedUser`)

### TypeScript Frontend
- Services: Injectable with `providedIn: 'root'`
- Components: Standalone components (no NgModules)
- Routing: File-based with guards for protected routes
- Naming: Swedish route paths (`/logga-in`, `/profil`) but English component names

## Common Gotchas

1. **Environment Setup**: Always run `generate-env.js` before serving frontend
2. **CORS Issues**: Ensure frontend URL is in backend CORS policy
3. **Auth Testing**: Use `/azure-debug` page, not production auth flow
4. **Database**: Check `useInMemory` flag in `Program.cs` for local vs persistent storage
5. **SignalR**: WebSocket URL scheme (`ws://` for HTTP, `wss://` for HTTPS)

## File Priorities for Changes
- **Config**: `appsettings.json`, `auth-config.ts`, `generate-env.js`
- **Core Logic**: `Program.cs`, `app.config.ts`, `AuthService`
- **Features**: Controllers + corresponding Angular services/components
- **DB**: Entity models, repositories, migrations