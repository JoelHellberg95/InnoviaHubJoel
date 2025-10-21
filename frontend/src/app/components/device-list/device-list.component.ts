import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IotService, DeviceWithLatestData } from '../../services/iot.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.css']
})
export class DeviceListComponent implements OnInit, OnDestroy {
  devices: DeviceWithLatestData[] = [];
  private sub?: Subscription;

  constructor(private iot: IotService) {}

  async ngOnInit() {
    await this.iot.loadDevices();
    await this.iot.startRealtimeConnection();
    this.sub = this.iot.devices$.subscribe(d => this.devices = d);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.iot.stopRealtimeConnection();
  }

  timeSince(iso?: string) {
    if (!iso) return 'N/A';
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    return `${h}h`;
  }

  // Determine whether a device should display a measurement field.
  // We consider a device supports a measurement if:
  // - it already has a latestMeasurements entry for that type, OR
  // - its model string contains a hint (e.g. 'co2', 'humidity', 'temp', 'multi')
  supportsMeasurement(d: DeviceWithLatestData, type: string): boolean {
    if (!d) return false;
    if (d.latestMeasurements && d.latestMeasurements[type]) return true;
    const model = (d.model || '').toLowerCase();
    switch (type) {
      case 'temperature':
        // Temperatur stöds för sensorer där model indikerar temp eller multi eller co2 (många co2-sensorer har temp också)
        return model.includes('temp') || model.includes('temperature') || model.includes('multi') || model.includes('co2');
      case 'co2':
        // CO2 om modellen innehåller 'co2' eller är en multi-sensor
        return model.includes('co2') || model.includes('multi');
      case 'humidity':
        // Humidity om modellen uttryckligen innehåller 'humidity' eller är en multi-sensor
        return model.includes('humidity') || model.includes('multi');
      default:
        return false;
    }
  }
}
