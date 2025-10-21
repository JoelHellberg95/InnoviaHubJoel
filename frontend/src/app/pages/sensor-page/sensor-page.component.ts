import { Component } from '@angular/core';
import { DeviceListComponent } from '../../components/device-list/device-list.component';

@Component({
  selector: 'app-sensor-page',
  standalone: true,
  imports: [DeviceListComponent],
  templateUrl: './sensor-page.component.html',
  styleUrl: './sensor-page.component.css'
})
export class SensorPageComponent {}
