import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import * as signalR from '@microsoft/signalr';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface Device {
  id: string;
  tenantId: string;
  roomId?: string | null;
  model: string;
  serial: string;
  status: string;
}

export interface RealtimeMeasurement {
  tenantSlug: string;
  deviceId: string;
  type: string;
  value: number;
  time: string;
}

export interface MeasurementData {
  value: number;
  time: string;
}

export interface DeviceWithLatestData extends Device {
  latestMeasurements: Record<string, MeasurementData | undefined>;
}

@Injectable({ providedIn: 'root' })
export class IotService {
  private devicesSubject = new BehaviorSubject<DeviceWithLatestData[]>([]);
  devices$ = this.devicesSubject.asObservable();

  private hubConnection?: signalR.HubConnection;
  private readonly tenantSlug = 'innovia';

  /**
   * IotService
   * Ansvar: kommunicera med IoT-backend (tenant/devices) och hantera SignalR-anslutning
   * - Hämtar tenant och devices via HTTP
   * - Startar/stannar en SignalR-anslutning och uppdaterar devices$ med realtime measurements
   *
   * Notera: Service använder miljövariabler från window.__env i frontend (NG_APP_IOT_API_URL, NG_APP_IOT_HUB_URL)
   */
  constructor(private http: HttpClient) {}

  /**
   * Hämta tenant-information baserat på slug
   * Första prioritet: NG_APP_IOT_API_URL (separat IoT-endpoint)
   * Fallback: NG_APP_API_URL (huvud-API) eller lokal fallback
   */
  async getTenantBySlug(slug = this.tenantSlug): Promise<Tenant> {
    // Prefer IoT-specific env vars so we don't replace the main backend settings.
    const base = window.__env?.NG_APP_IOT_API_URL || window.__env?.NG_APP_API_URL || 'http://localhost:5101';
    const url = `${base}/api/tenants/by-slug/${slug}`;
    return firstValueFrom(this.http.get<Tenant>(url));
  }

  /**
   * Hämta alla enheter för angiven tenant
   * Returnerar Device[] eller kastar fel som fångas av anroparen
   */
  async getDevices(tenantId: string): Promise<Device[]> {
    // Prefer IoT-specific API URL so devices are fetched from the IoT backend
    const base = window.__env?.NG_APP_IOT_API_URL || window.__env?.NG_APP_API_URL || 'http://localhost:5101';
    const url = `${base}/api/tenants/${tenantId}/devices`;
    return firstValueFrom(this.http.get<Device[]>(url));
  }

  /**
   * loadDevices
   * - Hämtar tenant
   * - Hämtar devices för tenant
   * - Initialiserar devices$ med devices utan measurements
   * Error handling: loggar vid fel och lämnar devicesSubject som tidigare
   */
  async loadDevices(): Promise<void> {
    try {
      const tenant = await this.getTenantBySlug();
      const devices = await this.getDevices(tenant.id);
      const wrapped = devices.map(d => ({ ...d, latestMeasurements: {} } as DeviceWithLatestData));
      this.devicesSubject.next(wrapped);
    } catch (err) {
      console.error('Failed to load devices', err);
    }
  }

  /**
   * Starta SignalR-anslutning mot hubben och lyssna på 'measurementReceived'
   * - Om NG_APP_IOT_HUB_URL finns används den som full URL
   * - Annars byggs en ws:// URL från NG_APP_API_URL
   */
  async startRealtimeConnection(): Promise<void> {
    if (this.hubConnection) {
      return;
    }

    // Determine hub URL. If NG_APP_HUB_URL is provided use it as the full URL
    // (it may already include ws:// and path). Otherwise fall back to NG_APP_API_URL
    // and build a ws:// URL pointing to /hub/telemetry.
    let hubUrl: string;
  const configuredHub = window.__env?.NG_APP_IOT_HUB_URL || window.__env?.NG_APP_HUB_URL;
    if (configuredHub) {
      hubUrl = configuredHub;
    } else {
      const apiBase = window.__env?.NG_APP_API_URL || 'http://localhost:5101';
      // replace http(s) with ws(s)
      hubUrl = apiBase.replace(/^http/, 'ws') + '/hub/telemetry';
    }

    // Bygg och konfigurera SignalR-anslutning
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    // När vi får en mätning, uppdatera rätt enhet
    this.hubConnection.on('measurementReceived', (msg: RealtimeMeasurement) => {
      this.onMeasurement(msg);
    });

    try {
      await this.hubConnection.start();
      // JoinTenant används av backend för att scopa meddelanden per tenant
      await this.hubConnection.invoke('JoinTenant', this.tenantSlug);
      console.log('SignalR connected to', hubUrl);
    } catch (err) {
      // Logga detaljerad felinformation så utvecklare kan felsöka nätverk/CORS/negotiate
      console.error(`SignalR connection error (tried ${hubUrl}):`, err);
    }
  }

  /**
   * Stoppa SignalR-anslutningen (om den är uppe)
   */
  async stopRealtimeConnection(): Promise<void> {
    if (!this.hubConnection) return;
    try {
      await this.hubConnection.stop();
    } catch (err) {
      console.error('Error stopping SignalR', err);
    } finally {
      this.hubConnection = undefined;
    }
  }

  private onMeasurement(m: RealtimeMeasurement) {
    // Hämta aktuell lista och hitta index för enheten som skickade mätningen
    const list = this.devicesSubject.getValue();
    const idx = list.findIndex(d => d.id === m.deviceId);
    if (idx === -1) {
      // Okänd enhet — ignorera.
      return;
    }

    // Kopiera enheten och uppdatera senaste mätningen för typen (temperature/co2/humidity)
    const device = { ...list[idx] } as DeviceWithLatestData;
    device.latestMeasurements = { ...(device.latestMeasurements || {}) };
    device.latestMeasurements[m.type] = { value: m.value, time: m.time };

    // Emittera en ny array för att trigga reaktiva uppdateringar i komponenter
    const newList = [...list];
    newList[idx] = device;
    this.devicesSubject.next(newList);
  }
}
