import {
  ApplicationConfig,
  importProvidersFrom,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  HTTP_INTERCEPTORS,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  MsalModule,
  MsalService,
  MsalGuard,
  MsalInterceptor,
  MsalBroadcastService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
} from '@azure/msal-browser';
import { msalConfig, protectedResources } from './auth-config';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  NativeDateAdapter,
} from '@angular/material/core';

export class MondayFirstDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 1;
  }
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export function initializeMsal(msalService: MsalService): () => Promise<void> {
  return () => {
    return msalService.instance.initialize();
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Popup,
    authRequest: {
      scopes: ['user.read'],
    },
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Popup,
    protectedResourceMap: new Map([
      [
        protectedResources.graphApi.endpoint,
        protectedResources.graphApi.scopes,
      ],
      // Temporarily disable innoviaApi mapping to avoid scope issues
      // [protectedResources.innoviaApi.endpoint, protectedResources.innoviaApi.scopes]
    ]),
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    { provide: MAT_DATE_LOCALE, useValue: 'sv-SE' },
    {
      provide: DateAdapter,
      useClass: MondayFirstDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    importProvidersFrom(MsalModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMsal,
      deps: [MsalService],
      multi: true,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};
