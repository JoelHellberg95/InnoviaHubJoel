import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  readonly apiUrl = window.__env?.NG_APP_API_URL || 'http://localhost:5184';

  readonly aiApiUrl = window.__env?.NG_APP_AI_API_URL || 'https://innoviahubjoel.onrender.com';

  readonly hubUrl = window.__env?.NG_APP_HUB_URL || 'ws://localhost:5184/hubs/bookings';

  readonly loginRedirectUrl = window.__env?.NG_APP_LOGIN_REDIRECT_URL || 'http://localhost:4200/profil';

  readonly logoutRedirectUrl = window.__env?.NG_APP_LOGOUT_REDIRECT_URL || 'http://localhost:4200/logga-in';
}
